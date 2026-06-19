import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { AssistantFab } from '@/components/assistant/AssistantFab';
import { AssistantSheet } from '@/components/assistant/AssistantSheet';
import { useAccessibilityMode } from '@/context/accessibility-context';
import { useLocale } from '@/context/locale-context';
const WIDE_BREAKPOINT = 768;

export default function TabLayout() {
  const { t } = useLocale();
  const { screenReaderEnabled } = useAccessibilityMode();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  if (screenReaderEnabled) {
    return <AssistantSheet visible fullScreen onClose={() => {}} />;
  }

  return (
    <View style={styles.flex}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          headerShown: false,
          tabBarButton: HapticTab,
          ...(isWide
            ? {
                tabBarPosition: 'left' as const,
                tabBarVariant: 'material' as const,
                tabBarLabelPosition: 'beside-icon' as const,
                tabBarStyle: styles.sidebar,
                tabBarItemStyle: styles.sidebarItem,
              }
            : null),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.personalization'),
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="slider.horizontal.3" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: t('nav.explore'),
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: t('nav.wallet'),
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="creditcard.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav.profile'),
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          }}
        />
      </Tabs>
      <AssistantFab />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sidebar: {
    width: 240,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    backgroundColor: Colors.white,
    paddingTop: 24,
  },
  sidebarItem: {
    borderRadius: 12,
    marginHorizontal: 12,
  },
});
