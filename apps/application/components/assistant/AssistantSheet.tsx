import { useRef, useState, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  type KeyboardEvent,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { usePathname } from 'expo-router';

import * as api from '@/lib/api';
import { ApiError, type AssistantAction } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';

const normFr = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const isAffirmation = (s: string) =>
  /^(oui|ouais|ok|okay|d.?accord|confirme[rz]?|valide[rz]?|applique[rz]?|vas-?y|c.?est bon|parfait|je confirme)\b/.test(
    normFr(s),
  );
const isNegation = (s: string) =>
  /^(non|annule[rz]?|laisse tomber|stop|pas maintenant|surtout pas|annulation)\b/.test(normFr(s));

// Détection déterministe d'une demande de changement de langue (ne dépend pas du modèle)
const LANG_TOKENS: { re: RegExp; locale: 'fr' | 'en' | 'es' | 'zh' }[] = [
  { re: /(francais|french)/, locale: 'fr' },
  { re: /(anglais|english)/, locale: 'en' },
  { re: /(espagnol|spanish|espanol)/, locale: 'es' },
  { re: /(chinois|chinese|mandarin)/, locale: 'zh' },
];
const LANG_INTENT =
  /\b(repond\w*|reponse|parl\w*|ecri\w*|dis|dire|passe|bascule|traduis\w*|answer|reply|speak|write|switch|change|talk|continue|en|in)\b/;
function detectLanguageRequest(msg: string): 'fr' | 'en' | 'es' | 'zh' | null {
  const m = normFr(msg);
  const hit = LANG_TOKENS.find((l) => l.re.test(m));
  if (!hit) return null;
  return LANG_INTENT.test(m) ? hit.locale : null;
}
const SWITCH_CONFIRM: Record<'fr' | 'en' | 'es' | 'zh', string> = {
  fr: "D'accord, je réponds désormais en français. Comment puis-je vous aider ?",
  en: "Sure, I'll reply in English from now on. How can I help you?",
  es: 'De acuerdo, responderé en español a partir de ahora. ¿En qué puedo ayudarle?',
  zh: '好的，我现在起用中文回复。请问有什么可以帮您？',
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;

const QUICK_TOPICS = [
  { key: 'assistant.topics.subscriptions', q: 'Quels abonnements sont disponibles ?' },
  { key: 'assistant.topics.account',       q: 'Comment gérer mon compte ?' },
  { key: 'assistant.topics.pricing',       q: "Quels sont les tarifs et conditions d'éligibilité ?" },
  { key: 'assistant.topics.support',       q: 'Comment contacter le service client ?' },
] as const;

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestions?: string[];
  cta?: { label: string; url: string } | null;
  action?: AssistantAction | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AssistantSheet({ visible, onClose }: Props) {
  const { t, locale, setLocale } = useLocale();
  const { user, refreshUser } = useAuth();
  const pathname = usePathname();
  const translateY      = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [kbHeight,   setKbHeight]   = useState(0);
  // Action proposée par LÉIA, en attente de confirmation (par message « oui » ou bouton)
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => setKbHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKbHeight(0),
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (messages.length === 0) {
        setMessages([{
          id: 'greeting',
          role: 'assistant',
          text: t('assistant.greeting'),
          suggestions: QUICK_TOPICS.map(tp => t(tp.key)),
        }]);
      }
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: SHEET_HEIGHT, duration: 280, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  const scrollSoon = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

  function pushAssistant(text: string) {
    setMessages(prev => [...prev, { id: `${Date.now()}-${prev.length}`, role: 'assistant', text }]);
    scrollSoon();
  }

  // Exécute l'action confirmée via l'API authentifiée (mêmes droits que l'utilisateur dans l'app)
  async function executeAction(action: AssistantAction) {
    if (!user) throw new ApiError(t('assistant.errorGeneric'), 401);
    switch (action.type) {
      case 'updateProfile':
        await api.updateUser(user.id, { firstName: action.firstName, lastName: action.lastName });
        break;
      case 'updatePreferences': {
        const merged = { ...(user.preferences ?? {}) };
        if (action.birthdate !== undefined) merged.birthdate = action.birthdate;
        if (action.status !== undefined) merged.status = action.status;
        if (action.usageDaysPerWeek !== undefined) merged.usageDaysPerWeek = action.usageDaysPerWeek;
        if (action.socialBeneficiary !== undefined) merged.socialBeneficiary = action.socialBeneficiary;
        await api.updateUser(user.id, { preferences: merged });
        break;
      }
      case 'initiateTransfer':
        await api.createTransferRequest({ subscription: action.subscriptionRef, toEmail: action.toEmail });
        break;
      case 'updateHolder':
        await api.updateSubscriptionHolder(action.subscriptionRef, {
          holderFirstName: action.holderFirstName,
          holderLastName: action.holderLastName,
        });
        break;
      case 'cancelSubscription':
        await api.cancelSubscription(action.subscriptionRef);
        break;
      case 'createSubscription':
        await api.createSubscription({
          plan: action.planRef,
          holderFirstName:
            action.forWhom === 'relative' ? action.holderFirstName : user.firstName ?? undefined,
          holderLastName:
            action.forWhom === 'relative' ? action.holderLastName : user.lastName ?? undefined,
        });
        break;
    }
  }

  async function applyAction(action: AssistantAction) {
    if (loading) return;
    setPendingAction(null);
    setLoading(true);
    scrollSoon();
    try {
      await executeAction(action);
      if (action.type === 'updateProfile' || action.type === 'updatePreferences') await refreshUser();
      pushAssistant(`✓ ${t('assistant.applied')}`);
    } catch (err) {
      pushAssistant(err instanceof ApiError ? `${t('assistant.applyError')} ${err.message}` : t('assistant.applyError'));
    } finally {
      setLoading(false);
      scrollSoon();
    }
  }

  function cancelAction() {
    setPendingAction(null);
    pushAssistant(t('assistant.cancelled'));
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const trimmed = text.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: trimmed }]);
    setInput('');
    scrollSoon();

    // Changement de langue à la demande : traité localement (déterministe, sans dépendre du modèle)
    const langReq = detectLanguageRequest(trimmed);
    if (langReq) {
      if (langReq !== locale) setLocale(langReq);
      setPendingAction(null);
      pushAssistant(SWITCH_CONFIRM[langReq]);
      return;
    }

    // Confirmation par message d'une action en attente (accessible : pas besoin du bouton)
    if (pendingAction) {
      if (isAffirmation(trimmed)) {
        await applyAction(pendingAction);
        return;
      }
      if (isNegation(trimmed)) {
        cancelAction();
        return;
      }
      // L'utilisateur passe à autre chose : on abandonne l'action en attente
      setPendingAction(null);
    }

    setLoading(true);
    try {
      // Historique (mémoire multi-tours) : les échanges précédents, hors message d'accueil et hors message courant
      const history = messages
        .filter(m => m.id !== 'greeting')
        .slice(-8)
        .map(m => ({ role: m.role, content: m.text }));
      const res = await api.askAssistant(trimmed, pathname, history, locale);
      // Changement de langue : préférence d'affichage → appliquée immédiatement, sans confirmation
      if (res.action?.type === 'setLanguage') {
        setLocale(res.action.locale);
        setPendingAction(null);
      } else {
        setPendingAction(res.action ?? null);
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: res.answer,
        suggestions: res.suggestions,
        cta: res.cta,
        action: res.action ?? null,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: err instanceof ApiError ? err.message : t('assistant.errorGeneric'),
      }]);
    } finally {
      setLoading(false);
      scrollSoon();
    }
  }

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerContent}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarEmoji}>✦</Text>
            </View>
            <View>
              <ThemedText type="defaultSemiBold" style={styles.headerTitle}>LÉIA</ThemedText>
              <ThemedText style={styles.headerSub}>Assistante IDFM</ThemedText>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Text style={styles.closeX}>✕</Text>
          </Pressable>
        </View>

        {/* Messages */}
        <View style={[styles.flex, { paddingBottom: kbHeight }]}>
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => (
              <View key={msg.id}>
                <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                  <Text style={[styles.bubbleText, msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
                    {msg.text}
                  </Text>
                </View>

                {/* Confirmation d'une action proposée (encore en attente) */}
                {msg.role === 'assistant' && msg.action && pendingAction === msg.action && (
                  <View style={styles.confirmRow}>
                    <Button
                      label={t('assistant.apply')}
                      onPress={() => applyAction(msg.action!)}
                      size="sm"
                      disabled={loading}
                    />
                    <Button
                      label={t('assistant.cancel')}
                      onPress={cancelAction}
                      variant="outline"
                      size="sm"
                      disabled={loading}
                    />
                  </View>
                )}

                {/* CTA */}
                {msg.cta && (
                  <View style={styles.ctaWrap}>
                    <Button
                      label={`${msg.cta.label} →`}
                      onPress={() => Linking.openURL(msg.cta!.url)}
                      variant="outline"
                      size="sm"
                    />
                  </View>
                )}

                {/* Suggestions */}
                {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                  <View style={styles.suggestions}>
                    {msg.suggestions.map((s, i) => (
                      <Button
                        key={i}
                        label={s}
                        onPress={() => sendMessage(s)}
                        variant="outline"
                        size="sm"
                      />
                    ))}
                  </View>
                )}
              </View>
            ))}

            {loading && (
              <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                <ThemedText style={styles.typingDots}>● ● ●</ThemedText>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={t('assistant.placeholder')}
              placeholderTextColor={Colors.textTertiary}
              onSubmitEditing={() => sendMessage(input)}
              returnKeyType="send"
              editable={!loading}
              multiline={false}
            />
            <Pressable
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              accessibilityRole="button"
              accessibilityLabel="Envoyer"
            >
              <Text style={styles.sendIcon}>↑</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji:  { color: '#fff', fontSize: 18 },
  headerTitle:  { fontSize: 16, color: Colors.text },
  headerSub:    { fontSize: 12, color: Colors.textSecondary },
  closeBtn:     { position: 'absolute', right: Spacing.lg, top: Spacing.sm + 4 },
  closeX:       { fontSize: 16, color: Colors.textSecondary },

  messages: { flex: 1 },
  messagesContent: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },

  bubble: {
    maxWidth: '82%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: Colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleText:          { fontSize: 15, lineHeight: 24 },
  bubbleTextUser:      { color: '#fff' },
  bubbleTextAssistant: { color: Colors.text },

  typingBubble: { paddingVertical: Spacing.sm },
  typingDots:   { color: Colors.textTertiary, letterSpacing: 3, fontSize: 12 },

  ctaWrap: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    marginLeft: 4,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    marginLeft: 4,
  },

  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: Colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
