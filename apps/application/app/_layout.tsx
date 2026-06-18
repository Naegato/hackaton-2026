import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { hasCurrentSubscription } from '@/lib/api';

// Nécessaire pour Expo Web : ferme le popup OAuth et renvoie le token au parent
WebBrowser.maybeCompleteAuthSession();

import { AccessibilityProvider } from '@/context/accessibility-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { LocaleProvider } from '@/context/locale-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { user, initializing } = useAuth();
  const router = useRouter();

  const authed = !!user;
  const ready = authed && user?.onboardingCompleted === true;

  // À la connexion (transition vers l'état « prêt »), si l'utilisateur a un abonnement en cours,
  // on l'amène directement sur « Mes abonnements » plutôt que sur l'onglet Personnalisation.
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (!ready) {
      redirectedRef.current = false;
      return;
    }
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    let active = true;
    (async () => {
      try {
        if (active && (await hasCurrentSubscription())) {
          router.replace('/(tabs)/wallet');
        }
      } catch {
        // pas de redirection si l'appel échoue : on reste sur l'onglet par défaut
      }
    })();
    return () => {
      active = false;
    };
  }, [ready, router]);

  // Tant que la session se charge, on évite tout flash login/app
  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const needsOnboarding = authed && user?.onboardingCompleted !== true;

  return (
    <Stack>
      {/* Connecté + onboarding fait → l'app */}
      <Stack.Protected guard={ready}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="preferences" options={{ presentation: 'modal', title: 'Préférences' }} />
        <Stack.Screen name="test-photo" options={{ presentation: 'modal', title: 'Test photo' }} />
        <Stack.Screen name="plan/[slug]" options={{ headerShown: true }} />
        <Stack.Screen name="subscribe/[slug]" options={{ headerShown: true }} />
        <Stack.Screen name="support" options={{ headerShown: false }} />
        <Stack.Screen name="legal/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="subscription/[id]" options={{ headerShown: false }} />
        {/* `subscribe` est un navigateur imbriqué (subscribe/_layout) qui gère son propre header → on masque celui de la pile racine */}
        <Stack.Screen name="subscribe" options={{ headerShown: false }} />
        <Stack.Screen name="relative" options={{ headerShown: true, title: 'Abonnement pour un proche' }} />
        <Stack.Screen name="transfer" options={{ headerShown: true, title: 'Transférer un abonnement' }} />
        <Stack.Screen name="subscription-holder" options={{ headerShown: true, title: 'Informations du titulaire' }} />
      </Stack.Protected>

      {/* Connecté mais 1ʳᵉ fois → questionnaire */}
      <Stack.Protected guard={needsOnboarding}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Déconnecté → auth */}
      <Stack.Protected guard={!authed}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AccessibilityProvider>
      <LocaleProvider>
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootNavigator />
            <StatusBar style="auto" />
          </ThemeProvider>
        </AuthProvider>
      </LocaleProvider>
    </AccessibilityProvider>
  );
}
