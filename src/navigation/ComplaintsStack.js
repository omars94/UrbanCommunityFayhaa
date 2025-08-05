import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ComplaintsScreen from '../screens/Complaints';
import AddComplaintScreen from '../screens/add';
import ComplaintDetails from '../screens/details';
import { routeNames } from '../constants';
const Stack = createNativeStackNavigator();

export default function ComplaintsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={routeNames.COMPLAINTS}
        component={ComplaintsScreen}
        options={{ title: 'الشكاوى' }}
      />
      <Stack.Screen
        name={routeNames.ADD_COMPLAINT}
        component={AddComplaintScreen}
        options={{ title: 'إضافة شكوى' }}
      />
      <Stack.Screen
        name={routeNames.COMPLAINT_DETAILS}
        component={ComplaintDetails}
        options={{ title: 'تفاصيل الشكوى' }}
      />
    </Stack.Navigator>
  );
}
