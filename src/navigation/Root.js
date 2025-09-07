import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState, useRef } from 'react';
import { I18nManager, StyleSheet, View, Image, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from '../../store';
import { ActivityIndicator } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import { clearUser, setUser } from '../slices/userSlice';
import { COLORS, ROUTE_NAMES } from '../constants';
import AuthScreen from '../screens/Auth';
import OTPScreen from '../screens/otp';
import TabLayout from './AppTabs';
import { getUserByFbUID } from '../api/userApi';
import { OneSignal, LogLevel } from 'react-native-onesignal';
import { ONESIGNAL_APP_ID } from '@env';
import { setUserForNotifications } from '../services/notifications';
import { navigationRef } from '../services/notifications';

const Stack = createNativeStackNavigator();

const { width, height } = Dimensions.get('window');

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = value => JSON.parse(JSON.stringify(value));
}
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
function Layout() {
  useEffect(() => {
    // Enable verbose logging (for setup, remove in production)
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);

    // Initialize OneSignal with your App ID
    OneSignal.initialize(ONESIGNAL_APP_ID);

    // Request permission (iOS only)
    OneSignal.Notifications.requestPermission(false);

    const handleNotificationClick = event => {
      console.log('=== OneSignal: Notification clicked ===');
      console.log('Full event object:', JSON.stringify(event, null, 2));

      // Check if we have the expected structure
      if (!event) {
        console.error('Event is null/undefined');
        return;
      }

      if (!event.notification) {
        console.error('event.notification is missing');
        return;
      }

      console.log(
        'Notification object:',
        JSON.stringify(event.notification, null, 2),
      );

      const data = event.notification.additionalData;
      console.log('Additional data:', JSON.stringify(data, null, 2));

      // Check navigation ref
      console.log('Navigation ref current:', navigationRef.current);
      console.log('Navigation ref ready:', !!navigationRef.current);

      if (data?.type === 'status_update' && data?.complaint) {
        console.log('Condition met - navigating...');
        console.log('Target complaint:', data.complaint);

        // Retry navigation with increasing delays
        const attemptNavigation = (attempt = 1, maxAttempts = 5) => {
          const delay = attempt * 500;

          setTimeout(() => {
            if (navigationRef.current && navigationRef.isReady?.()) {
              console.log(`Navigation attempt ${attempt} - SUCCESS!`);
              try {
                // Navigate to the complaint details with full complaint object
                navigationRef.current.navigate(ROUTE_NAMES.MAIN, {
                  screen: ROUTE_NAMES.COMPLAINTS,
                  params: {
                    screen: ROUTE_NAMES.COMPLAINT_DETAILS,
                    params: { complaint: data.complaint },
                  },
                });
                console.log('Navigation called successfully');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            } else if (attempt < maxAttempts) {
              console.log(`Navigation attempt ${attempt} failed, retrying...`);
              attemptNavigation(attempt + 1, maxAttempts);
            } else {
              console.error(`Navigation failed after ${maxAttempts} attempts`);
            }
          }, delay);
        };

        attemptNavigation();
      } else {
        console.log('Condition not met:');
        console.log('data?.type:', data?.type);
        console.log('data?.complaint:', data?.complaint);
        console.log('Expected type: status_update');
      }
    };
    OneSignal.Notifications.addEventListener('click', handleNotificationClick);

    return () => {
      OneSignal.Notifications.removeEventListener(
        'click',
        handleNotificationClick,
      );
    };
  }, []);

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
      if (firebaseUser && firebaseUser.emailVerified) {
        // User is signed in
        console.log('user email verified');
        const token = await firebaseUser.getIdToken();
        console.log('UID from user object:', firebaseUser.uid);
        const user = await getUserByFbUID(firebaseUser.uid);
        console.log(user);
        dispatch(setUser(user));
        console.log('user email:', user.email);
        if (user && user.email) {
          await setUserForNotifications(user.email);
        }
        setReady(true);
      } else {
        setReady(true);
        console.log('user email not verified');
        // User is signed out
        dispatch(clearUser());
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [dispatch]);

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require('../assets/loadingImage.png')}
          style={styles.loadingImage}
          resizeMode="contain"
        />
      </View>
    );
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

const styles = StyleSheet.create({
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingImage: {
    width: width,
  },
});
