import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/Colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  index:        { active: 'navigate',       inactive: 'navigate-outline' },
  horaires:     { active: 'time',           inactive: 'time-outline' },
  infos:        { active: 'warning',        inactive: 'warning-outline' },
  titres:       { active: 'card',           inactive: 'card-outline' },
  'mon-espace': { active: 'person',         inactive: 'person-outline' },
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={24}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="index"        options={{ title: 'Itinéraires' }} />
      <Tabs.Screen name="horaires"     options={{ title: 'Horaires' }} />
      <Tabs.Screen name="infos"        options={{ title: 'Infos trafic' }} />
      <Tabs.Screen name="titres"       options={{ title: 'Titres' }} />
      <Tabs.Screen name="mon-espace"   options={{ title: 'Mon espace' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 72,
    paddingBottom: 12,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
