import { Ionicons } from '@react-native-vector-icons/ionicons';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home';
import WasteScreen from '../screens/waste';
import ProfileScreen from '../screens/profile';
import ComplaintsStack from './ComplaintsStack';
import { ROUTE_NAMES } from '../constants';
import { View } from 'react-native';

const Tab = createBottomTabNavigator();
export default function TabLayout(props) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: false,
        tabBarIcon: ({ color, size }) => {
          let icon;
          if (route.name === ROUTE_NAMES.HOME) icon = 'home-outline';
          if (route.name === ROUTE_NAMES.COMPLAINTS) icon = 'chatbubble-outline';
          if (route.name === ROUTE_NAMES.WASTE) icon = 'trash-outline';
          if (route.name === ROUTE_NAMES.PROFILE) icon = 'person-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name={ROUTE_NAMES.COMPLAINTS}
        component={ComplaintsStack}
        options={{ title: 'الشكاوى' }}
      />
      <Tab.Screen
        name={ROUTE_NAMES.HOME}
        component={HomeScreen}
        options={{ title: 'الرئيسية' }}
      />
      <Tab.Screen
        name={ROUTE_NAMES.WASTE}
        component={WasteScreen}
        options={{ title: 'النفايات' }}
      />
      <Tab.Screen
        name={ROUTE_NAMES.PROFILE}
        component={ProfileScreen}
        options={{ title: 'الملف الشخصي' }}
      />
    </Tab.Navigator>
  );
}
