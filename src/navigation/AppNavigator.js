import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import B2CRegistrationScreen from '../screens/auth/B2CRegistrationScreen';
import B2BRegistrationScreen from '../screens/auth/B2BRegistrationScreen';
import OrdersFeedScreen from '../screens/worker/OrdersFeedScreen';
import OrderDetailScreen from '../screens/worker/OrderDetailScreen';
import CreateOrderScreen from '../screens/client/CreateOrderScreen';
import OrderWaitingScreen from '../screens/client/OrderWaitingScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
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
        <Stack.Screen name="B2CRegistration" component={B2CRegistrationScreen}/>
        <Stack.Screen name="B2BRegistration" component={B2BRegistrationScreen}/>
        <Stack.Screen name="OrdersFeed" component={OrdersFeedScreen}/>
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen}/>
        <Stack.Screen name="CreateOrder" component={CreateOrderScreen}/>
        <Stack.Screen name="OrderWaiting" component={OrderWaitingScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}