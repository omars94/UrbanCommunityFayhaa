import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ComplaintsScreen from '../screens/Complaints';
import AddComplaintScreen from '../screens/add';
import ComplaintDetails from '../screens/details';
import { ROUTE_NAMES } from '../constants';
const Stack = createNativeStackNavigator();

export default function ComplaintsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={ROUTE_NAMES.COMPLAINTS}
        component={ComplaintsScreen}
        options={{ title: 'الشكاوى' }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.ADD_COMPLAINT}
        component={AddComplaintScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.COMPLAINT_DETAILS}
        component={ComplaintDetails}
        options={{ title: 'تفاصيل الشكوى' }}
      />
    </Stack.Navigator>
  );
}
