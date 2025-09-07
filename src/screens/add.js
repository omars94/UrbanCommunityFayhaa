import React, { useState } from 'react';
import {
  Alert,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { launchCamera } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import SimplePicker from '../components/SimplePicker';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
  SIZES,
  COMPLAINT_STATUS,
} from '../constants/index.ts';
import { ScrollView } from 'react-native-gesture-handler';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { addComplaint } from '../slices/complaintsSlice.js';
import {
  requestLocationPermission,
  requestCameraPermissions,
} from '../utils/Permissions.js';
import { addNewComplaint } from '../api/complaintsApi.js';
import { getAdminEmails } from '../api/userApi.js';
import { sendComplaintSttsNotification } from '../services/notifications.js';
import ImageService from '../services/ImageService.js';

//Yup validation schema
const ComplaintSchema = Yup.object().shape({
  indicator: Yup.object().required('يرجى اختيار نوع المشكلة'),
  area: Yup.object().required('يرجى اختيار المنطقة'),
  description: Yup.string().trim().required('يرجى إدخال الوصف'),
  photo: Yup.mixed().required('يرجى إرفاق صورة'),
});

export default function AddComplaintScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [imageProcessing, setImageProcessing] = useState(false);

  const { areas, indicators } = useSelector(state => state.data);
  const { user } = useSelector(state => state.user);

  console.log('Areas from Redux:', areas);
  console.log('Indicators from Redux:', indicators);
  console.log('Current User:', user);
  console.log('Current User id:', user?.id);

  const checkLocationServicesEnabled = () => {
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

  const showLocationSettingsAlert = () => {
    Alert.alert(
      'خدمات الموقع مطلوبة',
      'يرجى تمكين خدمات الموقع لاستخدام ميزة الكاميرا.',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'فتح الإعدادات',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ],
    );
  };

  const takePhoto = async setFieldValue => {
    const cameraGranted = await requestCameraPermissions();
    if (!cameraGranted) return;

    const locationGranted = await requestLocationPermission();
    if (!locationGranted) return;

    const locationServicesEnabled = await checkLocationServicesEnabled();
    if (!locationServicesEnabled) {
      showLocationSettingsAlert();
      return;
    }

    const result = await launchCamera({
      mediaType: 'photo',
      saveToPhotos: false,
    });

    console.log('Camera result:', result);

    if (!result.didCancel && result.assets?.[0]?.uri) {
      const originalUri = result.assets[0].uri;

      // Validate image first
      // const validation = await ImageService.validateImage(originalUri);
      // if (!validation.valid) {
      //   Alert.alert('خطأ في الصورة', validation.error);
      //   return;
      // }

      // Set the original URI immediately for preview
      setFieldValue('photo', originalUri);

      Geolocation.getCurrentPosition(
        position => {
          setMetadata({
            location: {
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
            },
            timestamp: new Date().toISOString(),
          });
        },
        error => {
          Alert.alert('خطأ', 'تعذر الحصول على الموقع');
          console.error(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    }
  };

  const handleSubmitComplaint = async values => {
    console.log('Starting submission...');
    setSubmitting(true);
    setImageProcessing(true);

    try {
      console.log('Processing and uploading images...');
      let thumbnailUrl = '';
      let fullImageUrl = '';

      if (values.photo) {
        const imageResult = await ImageService.processAndUploadImages(
          values.photo,
          'issues',
        );

        if (imageResult.success) {
          thumbnailUrl = imageResult.thumbnailUrl;
          fullImageUrl = imageResult.fullImageUrl;
          console.log('Images uploaded successfully:', {
            thumbnailUrl,
            fullImageUrl,
          });
        } else {
          throw new Error(imageResult.error || 'Failed to upload images');
        }
      }

      setImageProcessing(false);

      const complaintData = {
        indicator_id: values.indicator.id,
        area_id: values.area.id,
        description: values.description.trim(),
        photo_url: fullImageUrl, // Full size image URL for detail view
        thumbnail_url: thumbnailUrl, // Thumbnail URL for list view
        longitude: metadata?.location?.longitude || '',
        latitude: metadata?.location?.latitude || '',
        status: COMPLAINT_STATUS.PENDING,
        user_id: user?.id,
        created_at: new Date().toISOString(),
        area_name: values.area.name_ar,
        indicator_name: values.indicator.description_ar,
      };

      console.log('Submitting to database...');
      console.log('Complete complaint data:', complaintData);
      console.log('User ID being sent:', complaintData.user_id);

      const result = await addNewComplaint(
        complaintData,
        dispatch,
        addComplaint,
      );
      console.log('Database result:', result);

      if (result.success) {
        console.log('Complaint saved, fetching admin emails...');
        const adminEmails = await getAdminEmails();

        console.log('Admin emails:', adminEmails);

        if (adminEmails.length > 0) {
          await sendComplaintSttsNotification(
            adminEmails,
            complaintData.status,
            result.complaint,
          );
        }
        console.log('Success! Showing alert...');
        Alert.alert('تم الحفظ بنجاح', 'تم حفظ الشكوى بنجاح', [
          {
            text: 'حسناً',
            onPress: () => {
              console.log('Navigating back...');
              navigation.goBack();
            },
          },
        ]);
      } else {
        console.log('Database error, showing error alert');
        Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      console.log('Setting submitting to false');
      setSubmitting(false);
      setImageProcessing(false);
    }
  };

  // Your form component return statement (updated)
  return (
    <ScrollView>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()} // or your navigation function
          >
            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تقديم شكوى</Text>
          <Text style={styles.headerSub}>الإبلاغ عن مشكلة في منطقتك</Text>
        </View>

        <Formik
          initialValues={{
            indicator: null,
            area: null,
            description: '',
            photo: null,
          }}
          validationSchema={ComplaintSchema}
          onSubmit={handleSubmitComplaint}
        >
          {({
            handleChange,
            handleSubmit,
            setFieldValue,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.content}>
              {/* Info Box */}
              {/* <View style={styles.infoBox}>
              <Text style={styles.infoText}>الموقع الحالي: طرابلس، لبنان</Text>
            </View> */}

              {/* Form Card */}
              <View style={styles.formCard}>
                {/* Photo Capture */}
                <View style={styles.photoSection}>
                  <TouchableOpacity
                    onPress={() => takePhoto(setFieldValue)}
                    style={[
                      styles.photoButton,
                      values.photo && styles.photoButtonWithImage,
                    ]}
                    disabled={imageProcessing}
                  >
                    {values.photo ? (
                      <Image
                        source={{ uri: values.photo }}
                        style={styles.photoPreview}
                      />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <MaterialDesignIcons
                          name="camera-plus-outline"
                          size={40}
                          color={COLORS.text.black}
                        />
                        <Text style={styles.photoText}>
                          التقط صورة لتوضيح المشكلة
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {touched.photo && errors.photo && (
                    <Text style={styles.errorText}>{errors.photo}</Text>
                  )}
                </View>

                {/* Pickers Section */}
                <View style={styles.pickersSection}>
                  <View style={styles.pickerContainer}>
                    <SimplePicker
                      label="نوع المشكلة"
                      options={indicators}
                      labelKey="description_ar"
                      selectedValue={values.indicator?.description_ar}
                      onValueChange={val => setFieldValue('indicator', val)}
                    />
                    {touched.indicator && errors.indicator && (
                      <Text style={styles.errorText}>{errors.indicator}</Text>
                    )}
                  </View>

                  <View style={styles.pickerContainer}>
                    <SimplePicker
                      label="المنطقة"
                      labelKey="name_ar"
                      options={areas}
                      selectedValue={values.area?.name_ar}
                      onValueChange={val => setFieldValue('area', val)}
                    />
                    {touched.area && errors.area && (
                      <Text style={styles.errorText}>{errors.area}</Text>
                    )}
                  </View>
                </View>

                {/* Description Input */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>وصف الشكوى</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="اكتب تفاصيل الشكوى هنا..."
                    placeholderTextColor={COLORS.text.black}
                    multiline
                    maxLength={300}
                    value={values.description}
                    onChangeText={handleChange('description')}
                    textAlign="right"
                  />
                  <Text style={styles.characterCount}>
                    {values.description.length}/300
                  </Text>
                  {touched.description && errors.description && (
                    <Text style={styles.errorText}>{errors.description}</Text>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  disabled={submitting || imageProcessing}
                  onPress={handleSubmit}
                  style={[
                    styles.submitButton,
                    (submitting || imageProcessing) &&
                      styles.submitButtonDisabled,
                  ]}
                >
                  <Text style={styles.submitButtonText}>
                    {imageProcessing
                      ? 'جاري معالجة الصورة...'
                      : submitting
                      ? 'جاري الإرسال...'
                      : 'إرسال الشكوى'}
                  </Text>
                  <Ionicons
                    name="send"
                    // name="paper-plane"
                    size={20}
                    color={COLORS.white}
                    style={styles.submitIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: SPACING.xl + 10,
  },
  backButton: {
    position: 'absolute',
    top: SPACING.lg + 20,
    left: SPACING.lg,
    zIndex: 1,
    padding: SPACING.xs,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  headerSub: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  // infoBox: {
  //   backgroundColor: COLORS.location,
  //   borderRadius: BORDER_RADIUS.sm,
  //   padding: SPACING.md,
  //   marginBottom: SPACING.lg,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  // },
  // infoText: {
  //   color: COLORS.text.secondary,
  //   fontSize: FONT_SIZES.sm,
  //   marginLeft: SPACING.sm,
  // },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  photoButton: {
    width: 300,
    height: 215,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[50],
  },
  photoButtonWithImage: {
    borderStyle: 'solid',
    borderColor: COLORS.gray[300],
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.md - 2,
  },
  photoText: {
    color: COLORS.text.black,
    fontSize: FONT_SIZES.md,
  },
  pickersSection: {
    marginBottom: 5,
  },
  pickerContainer: {
    marginBottom: SPACING.sm,
  },
  inputSection: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.sm,
    // textAlign: 'right',
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[500],
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    minHeight: 120,
    textAlignVertical: 'top',
    color: COLORS.text.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginLeft: SPACING.sm,
  },
  characterCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.hint,
    // textAlign: 'right',
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: SIZES.button.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primary,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  submitIcon: {
    marginRight: SPACING.sm,
    transform: [{ rotate: '180deg' }],
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginRight: SPACING.xs,
  },
  errorText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
    fontWeight: FONT_WEIGHTS.medium,
    // textAlign: 'right',
  },
});
