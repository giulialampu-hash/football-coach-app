import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { colors } from '@/theme';

const icons = {
  index: ['home-outline', 'home'],
  board: ['grid-outline', 'grid'],
  team: ['people-outline', 'people'],
  training: ['checkbox-outline', 'checkbox'],
} as const;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: colors.surface, height: 52 },
      headerShadowVisible: true,
      headerTitleAlign: 'center',
      headerTitleStyle: { fontFamily: 'Manrope_800ExtraBold', color: colors.ink, fontSize: 18 },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { minHeight: 68, paddingTop: 6, paddingBottom: 8, backgroundColor: colors.surface },
      tabBarLabelStyle: { fontFamily: 'Manrope_700Bold', fontSize: 11 },
      tabBarIcon: ({ color, focused, size }) => {
        const pair = icons[route.name as keyof typeof icons] ?? icons.index;
        return <Ionicons name={pair[focused ? 1 : 0]} color={color} size={size} />;
      },
    })}>
      <Tabs.Screen name="index" options={{ title: 'Home', headerTitle: 'Football Coach' }} />
      <Tabs.Screen name="board" options={{ title: 'Lavagnetta' }} />
      <Tabs.Screen name="team" options={{ title: 'Squadra' }} />
      <Tabs.Screen name="training" options={{ title: 'Allenamenti' }} />
    </Tabs>
  );
}
