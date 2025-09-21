import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTE_NAMES } from '../constants';
import ProfileScreen from '../screens/profile';
import AddManagerScreen from '../screens/AddManager';
import AddWorkerScreen from '../screens/AddWorker';
import SettingsScreen from '../screens/Settings';
import AddUserForm from '../screens/AddUserForm';
import AddSupervisorScreen from '../screens/AddSupervisor';
const Stack = createNativeStackNavigator();

export default function SettingsStack() {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name={ROUTE_NAMES.SETTINGS}
          component={SettingsScreen}
          options={{ title: ' الاعدادات', headerShown: false }}
        />
        <Stack.Screen
          name={ROUTE_NAMES.PROFILE}
          component={ProfileScreen}
          options={{ title: 'الملف الشخصي', headerShown: false  }}
        />
        <Stack.Screen
          name={ROUTE_NAMES.ADD_SUPERVISOR}
          component={AddSupervisorScreen}
          options={{ title: 'ادارة المراقبين', headerShown: false  }}
        />
        <Stack.Screen
          name={ROUTE_NAMES.ADD_MANAGER}
          component={AddManagerScreen}
          options={{ title: 'ادارة المديرين', headerShown: false  }}
        />
        <Stack.Screen
          name={ROUTE_NAMES.ADD_WORKER}
          component={AddWorkerScreen}
          options={{ title: 'ادارة الموظفين', headerShown: false  }}
        />
        <Stack.Screen
          name={ROUTE_NAMES.ADD_USER_FORM}
          component={AddUserForm}
          options={{ title: 'اضافة ', headerShown: false  }}
        />
      </Stack.Navigator>
    );
  }