import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

type AccessibilityState = {
  /** VoiceOver (iOS) ou TalkBack (Android) actif : on adapte l'UI pour la navigation au lecteur d'écran. */
  screenReaderEnabled: boolean;
};

const AccessibilityContext = createContext<AccessibilityState | undefined>(undefined);

const FORCE_SCREEN_READER = process.env.EXPO_PUBLIC_FORCE_SCREEN_READER === 'true';

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(FORCE_SCREEN_READER);

  useEffect(() => {
    if (FORCE_SCREEN_READER) return;
    // react-native-web n'a pas de vraie détection de lecteur d'écran :
    // `isScreenReaderEnabled` y retourne toujours `true`, ce qui casserait l'UI web pour tout le monde.
    if (Platform.OS === 'web') return;
    let active = true;
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (active) setScreenReaderEnabled(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReaderEnabled,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return (
    <AccessibilityContext.Provider value={{ screenReaderEnabled }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityMode(): AccessibilityState {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibilityMode doit être utilisé dans un <AccessibilityProvider>');
  return ctx;
}
