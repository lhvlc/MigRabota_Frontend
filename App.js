import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RoleSelectionScreen from './src/screens/auth/RoleSelectionScreen';
import WorkerProfileScreen from './src/screens/worker/WorkerProfileScreen';
import OrdersFeedScreen from './src/screens/worker/OrdersFeedScreen';
import OrderDetailScreen from './src/screens/worker/OrderDetailScreen';
import EmployerProfileScreen from './src/screens/client/EmployerProfileScreen';
import CreateOrderScreen from './src/screens/client/CreateOrderScreen';
import OrderWaitingScreen from './src/screens/client/OrderWaitingScreen';
import ViewWorkerProfileScreen from './src/screens/client/ViewWorkerProfileScreen';
import WalletScreen from './src/screens/WalletScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="RoleSelection"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0D1B2A' },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen}/>
        <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen}/>
        <Stack.Screen name="OrdersFeed" component={OrdersFeedScreen}/>
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen}/>
        <Stack.Screen name="EmployerProfile" component={EmployerProfileScreen}/>
        <Stack.Screen name="CreateOrder" component={CreateOrderScreen}/>
        <Stack.Screen name="OrderWaiting" component={OrderWaitingScreen}/>
        <Stack.Screen name="ViewWorkerProfile" component={ViewWorkerProfileScreen}/>
        <Stack.Screen name="Wallet" component={WalletScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}