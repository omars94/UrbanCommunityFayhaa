import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from '../../store';
import { ActivityIndicator } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import { clearUser, setUser } from '../slices/userSlice';
import { ROUTE_NAMES } from '../constants';
import AuthScreen from '../screens/Auth';
import OTPScreen from '../screens/otp';
import TabLayout from './AppTabs';
import { getUserByFbUID } from '../api/userApi';
const Stack = createNativeStackNavigator();

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = value => JSON.parse(JSON.stringify(value));
}
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
function Layout() {
  const [ready, setReady] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user);
  useEffect(() => {
    // getSession();
  }, [user]);
  useEffect(() => {
    async function configureRTL() {
      const configured = await AsyncStorage.getItem('RTL_CONFIGURED');
      if (!configured) {
        // 1. Allow your app to use RTL
        I18nManager.allowRTL(true);
        // 2. Force the layout to RTL
        I18nManager.forceRTL(true);
        // 3. Mark as done so we don’t do this again
        await AsyncStorage.setItem('RTL_CONFIGURED', 'true');
        // 4. Reload the app to apply RTL at startup
      } else {
        I18nManager.allowRTL(true);
        // 2. Force the layout to RTL
        I18nManager.forceRTL(true);

        // already configured: we can hide the splash and render
      }
    }
    configureRTL();
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        // User is signed in
        const token = await firebaseUser.getIdToken();
        console.log("UID from user object:", firebaseUser.uid);
        const user = await getUserByFbUID(firebaseUser.uid);
        console.log(user);
        dispatch(
          setUser(user),
        );
        setReady(true);
      } else {
        setReady(true);
        // User is signed out
        dispatch(clearUser());
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  if (!ready) {
    return <ActivityIndicator />;
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name={ROUTE_NAMES.SIGN_IN} component={AuthScreen} />
          <Stack.Screen name={ROUTE_NAMES.OTP} component={OTPScreen} />
        </>
      ) : (
        <Stack.Screen name={ROUTE_NAMES.MAIN} component={TabLayout} />
      )}
    </Stack.Navigator>
  );
}

export default function Root() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView>
        <SafeAreaProvider>
          <Layout />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
