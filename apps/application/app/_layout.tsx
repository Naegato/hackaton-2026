import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

// Nécessaire pour Expo Web : ferme le popup OAuth et renvoie le token au parent
WebBrowser.maybeCompleteAuthSession();

import { AuthProvider, useAuth } from '@/context/auth-context';
import { LocaleProvider } from '@/context/locale-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { user, initializing } = useAuth();

  // Tant que la session se charge, on évite tout flash login/app
  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const authed = !!user;
  const ready = authed && user?.onboardingCompleted === true;
  const needsOnboarding = authed && user?.onboardingCompleted !== true;

  return (
    <Stack>
      {/* Connecté + onboarding fait → l'app */}
      <Stack.Protected guard={ready}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="preferences" options={{ presentation: 'modal', title: 'Préférences' }} />
        <Stack.Screen name="test-photo" options={{ presentation: 'modal', title: 'Test photo' }} />
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
    <LocaleProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootNavigator />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
