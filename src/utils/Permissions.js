import { Alert, PermissionsAndroid, Platform, Linking } from 'react-native';
// import messaging from '@react-native-firebase/messaging';

// export async function requestNotificationsPermission() {
//   if (Platform.OS === 'android') {
//     if (Platform.Version >= 33) {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
//       );
//       return granted === PermissionsAndroid.RESULTS.GRANTED;
//     } else {
//       return true;
//     }
//   } else {
//     // iOS flow
//     const authStatus = await messaging().requestPermission();
//     return (
//       authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//       authStatus === messaging.AuthorizationStatus.PROVISIONAL
//     );
//   }
// }

export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      // Request location permission
      const locationGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'إذن الموقع',
          message: 'التطبيق يحتاج إلى إذن الموقع ليعمل بشكل صحيح',
          buttonNeutral: 'اسألني لاحقاً',
          buttonNegative: 'إلغاء',
          buttonPositive: 'موافق',
        },
      );

      // If user permanently denied
      if (locationGranted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'تم رفض الإذن نهائياً',
          'من فضلك قم بتمكين إذن الموقع من إعدادات التطبيق.',
          [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'فتح الإعدادات', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      // If denied (but not permanent)
      if (locationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        const retry = await new Promise(resolve => {
          Alert.alert('تم رفض الإذن', 'يلزم منح إذن الموقع!', [
            { text: 'إلغاء', onPress: () => resolve(false), style: 'cancel' },
            { text: 'حاول مرة أخرى', onPress: () => resolve(true) },
          ]);
        });

        return retry ? await requestLocationPermission() : false;
      }

      // If granted
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  // iOS always true (you may want react-native-permissions here)
  return true;
};

export const requestCameraPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const cameraGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'إذن الكاميرا',
          message: 'التطبيق يحتاج إلى إذن الكاميرا ليعمل بشكل صحيح',
          buttonNeutral: 'اسألني لاحقاً',
          buttonNegative: 'إلغاء',
          buttonPositive: 'موافق',
        },
      );

      //Case 1: User chose "Never ask again"
      if (cameraGranted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'تم رفض الإذن نهائياً',
          'لقد اخترت "عدم السؤال مرة أخرى". من فضلك قم بتمكين إذن الكاميرا من إعدادات التطبيق.',
          [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'فتح الإعدادات', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      //Case 2: User denied (normal)
      if (cameraGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        const retry = await new Promise(resolve => {
          Alert.alert('تم رفض الإذن', 'يلزم منح إذن الكاميرا!', [
            { text: 'إلغاء', onPress: () => resolve(false), style: 'cancel' },
            { text: 'حاول مرة أخرى', onPress: () => resolve(true) },
          ]);
        });

        return retry ? await requestCameraPermissions() : false;
      }

      //Case 3: Granted
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  // iOS → always true (or handle via react-native-permissions)
  return true;
};
