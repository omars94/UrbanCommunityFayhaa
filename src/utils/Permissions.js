import { Alert, PermissionsAndroid, Platform, Linking } from 'react-native';

export const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      // Request camera permission
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

      // Handle camera permission results
      if (cameraGranted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'تم رفض الإذن نهائياً',
          'من فضلك قم بتمكين إذن الكاميرا من إعدادات التطبيق.',
          [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: 'فتح الإعدادات',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return false;
      }

      if (cameraGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        // Show alert with option to try again
        await new Promise(resolve => {
          Alert.alert('تم رفض الإذن', 'يلزم منح إذن الكاميرا!', [
            { text: 'إلغاء', onPress: () => resolve(false), style: 'cancel' },
            { text: 'حاول مرة أخرى', onPress: () => resolve(true) },
          ]);
        });
        return await requestPermissions(); // Recursively call to request again
      }

      // Handle location permission results
      if (locationGranted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'تم رفض الإذن نهائياً',
          'من فضلك قم بتمكين إذن الموقع من إعدادات التطبيق.',
          [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: 'فتح الإعدادات',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return false;
      }

      if (locationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        // Show alert with option to try again
        await new Promise(resolve => {
          Alert.alert('تم رفض الإذن', 'يلزم منح إذن الموقع!', [
            { text: 'إلغاء', onPress: () => resolve(false), style: 'cancel' },
            { text: 'حاول مرة أخرى', onPress: () => resolve(true) },
          ]);
        });
        return await requestPermissions(); // Recursively call to request again
      }

      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

export const requestCameraPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      // Request camera permission
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

      // Handle camera permission results
      if (cameraGranted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'تم رفض الإذن نهائياً',
          'من فضلك قم بتمكين إذن الكاميرا من إعدادات التطبيق.',
          [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: 'فتح الإعدادات',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return false;
      }

      if (cameraGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        // Show alert with option to try again
        await new Promise(resolve => {
          Alert.alert('تم رفض الإذن', 'يلزم منح إذن الكاميرا!', [
            { text: 'إلغاء', onPress: () => resolve(false), style: 'cancel' },
            { text: 'حاول مرة أخرى', onPress: () => resolve(true) },
          ]);
        });
        return await requestCameraPermissions(); // Recursively call to request again
      }

      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};