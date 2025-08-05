import { Ionicons } from '@react-native-vector-icons/ionicons';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home';
import WasteScreen from '../screens/waste';
import ProfileScreen from '../screens/profile';
import ComplaintsStack from './ComplaintsStack';
import { routeNames } from '../constants';
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
          if (route.name === routeNames.HOME) icon = 'home-outline';
          if (route.name === routeNames.COMPLAINTS) icon = 'chatbubble-outline';
          if (route.name === routeNames.WASTE) icon = 'trash-outline';
          if (route.name === routeNames.PROFILE) icon = 'person-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name={routeNames.COMPLAINTS}
        component={ComplaintsStack}
        options={{ title: 'الشكاوى' }}
      />
      <Tab.Screen
        name={routeNames.HOME}
        component={HomeScreen}
        options={{ title: 'الرئيسية' }}
      />
      <Tab.Screen
        name={routeNames.WASTE}
        component={WasteScreen}
        options={{ title: 'النفايات' }}
      />
      <Tab.Screen
        name={routeNames.PROFILE}
        component={ProfileScreen}
        options={{ title: 'الملف الشخصي' }}
      />
    </Tab.Navigator>
  );
}
