import { Alert, PermissionsAndroid, Platform, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (hasPermission) {
        return true;
      }

      const locationGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      // If user permanently denied in system dialog
      if (locationGranted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        await new Promise(resolve => {
          Alert.alert(
            '\u202Bتم رفض الإذن نهائياً',
            '\u202Bلقد اخترت "عدم السؤال مرة أخرى". من فضلك قم بتمكين إذن الموقع من إعدادات التطبيق.',
            [
              {
                text: 'إلغاء',
                style: 'cancel',
                onPress: () => resolve('cancel'),
              },
              {
                text: 'فتح الإعدادات',
                onPress: () => {
                  Linking.openSettings();
                  resolve('settings');
                },
              },
            ],
          );
        });
        return false;
      }

      // If denied in system dialog, show custom alert and retry
      if (locationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        const retry = await new Promise(resolve => {
          Alert.alert(
            'تم رفض الإذن',
            'التطبيق يحتاج إلى إذن الموقع ليعمل بشكل صحيح',
            [
              {
                text: 'إلغاء',
                onPress: () => resolve(false),
                style: 'cancel',
              },
              {
                text: 'حاول مرة أخرى',
                onPress: () => resolve(true),
              },
            ],
          );
        });

        if (!retry) {
          return false;
        }

        // Retry the entire flow
        return await requestLocationPermission();
      }

      // Permission granted
      return true;
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  }

  // iOS handling
  return true;
};

export const requestCameraPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );

      if (hasPermission) {
        return true;
      }
      const cameraGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );

      // If user permanently denied in system dialog
      if (cameraGranted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        await new Promise(resolve => {
          Alert.alert(
            'تم رفض الإذن نهائياً',
            'لقد اخترت "عدم السؤال مرة أخرى". من فضلك قم بتمكين إذن الكاميرا من إعدادات التطبيق.',
            [
              {
                text: 'إلغاء',
                style: 'cancel',
                onPress: () => resolve('cancel'),
              },
              {
                text: 'فتح الإعدادات',
                onPress: () => {
                  Linking.openSettings();
                  resolve('settings');
                },
              },
            ],
          );
        });
        return false;
      }

      // If denied in system dialog, show custom alert and retry
      if (cameraGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        const retry = await new Promise(resolve => {
          Alert.alert(
            'تم رفض الإذن',
            'التطبيق يحتاج إلى إذن الكاميرا ليعمل بشكل صحيح',
            [
              {
                text: 'إلغاء',
                onPress: () => resolve(false),
                style: 'cancel',
              },
              {
                text: 'حاول مرة أخرى',
                onPress: () => resolve(true),
              },
            ],
          );
        });

        if (!retry) {
          return false;
        }
        return await requestCameraPermissions();
      }
      return true;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  }

  // iOS handling
  return true;
};

export const checkLocationServicesEnabled = () => {
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        position => {
          resolve(true);
        },
        error => {
          // Check error codes to determine if location services are disabled
          if (error.code === 1) {
            // PERMISSION_DENIED - could be permissions or location services off
            resolve(false);
          } else if (error.code === 2) {
            // POSITION_UNAVAILABLE - location services might be off
            resolve(false);
          } else if (error.code === 3) {
            // TIMEOUT - services are on but taking too long
            resolve(true);
          } else {
            resolve(false);
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    });
  };
