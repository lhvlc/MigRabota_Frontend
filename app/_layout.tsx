import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#1B263B',
        borderTopColor: '#0D1B2A',
      },
      tabBarActiveTintColor: '#C9B47F',
      tabBarInactiveTintColor: '#778DA9',
    }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Заказы', tabBarIcon: () => null }}
      />
    </Tabs>
  );
}