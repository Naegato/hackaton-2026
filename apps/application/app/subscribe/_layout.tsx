import { Stack } from 'expo-router';

import { Colors } from '@/constants/Colors';

export default function SubscribeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.primary,
        headerTitleStyle: { color: Colors.text, fontWeight: '700' },
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="profile" options={{ title: '' }} />
      <Stack.Screen name="ai" options={{ title: '' }} />
      <Stack.Screen name="result" options={{ title: '' }} />
      <Stack.Screen name="checkout" options={{ title: '' }} />
      <Stack.Screen name="payment" options={{ title: '' }} />
      <Stack.Screen name="confirmation" options={{ title: '', headerBackVisible: false }} />
      <Stack.Screen name="catalogue" options={{ title: '' }} />
    </Stack>
  );
}
