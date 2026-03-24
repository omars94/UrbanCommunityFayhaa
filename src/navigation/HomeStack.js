import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home';
import ReportsScreen from '../screens/Reports';
import { ROUTE_NAMES } from '../constants';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ROUTE_NAMES.HOME}
        component={HomeScreen}
        options={{ title: 'الرئيسية' }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.REPORTS}
        component={ReportsScreen}
        options={{ title: 'التقارير' }}
      />
    </Stack.Navigator>
  );
}
