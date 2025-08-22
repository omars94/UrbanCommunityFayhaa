import React, { useState } from 'react';
import {
  Alert,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
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
} from '../constants/index.ts';
import { ScrollView } from 'react-native-gesture-handler';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { addComplaint } from '../slices/complaintsSlice.js';
import { requestPermissions } from '../utils/Permissions.js';
import storage from '@react-native-firebase/storage';
import { addNewComplaint } from '../api/complaintsApi.js';

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

  const { areas, indicators } = useSelector(state => state.data);
  const { user } = useSelector(state => state.user);

  console.log('Areas from Redux:', areas);
  console.log('Indicators from Redux:', indicators);
  console.log('Current User:', user);
  console.log('Current User id:', user?.id);

  const uploadPhoto = async uri => {
    const filename = `issues/${Date.now()}.jpg`;
    const reference = storage().ref(filename);
    await reference.putFile(uri);
    return await reference.getDownloadURL();
  };

  const takePhoto = async setFieldValue => {
    const granted = await requestPermissions();
    if (!granted) return; // stop if permissions not granted

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: false,
    });

    console.log('Camera result:', result);

    if (!result.didCancel && result.assets?.[0]?.uri) {
      Geolocation.getCurrentPosition(
        position => {
          setFieldValue('photo', result.assets[0].uri); //  set Formik value
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
    try {
      console.log('Uploading photo...');
      let photoUrl = '';
      if (values.photo) {
        photoUrl = await uploadPhoto(values.photo);
        console.log('Photo uploaded:', photoUrl);
      }

      const complaintData = {
        indicator_id: values.indicator.id,
        area_id: values.area.id,
        description: values.description.trim(),
        photo_url: photoUrl,
        longitude: metadata?.location?.longitude || '',
        latitude: metadata?.location?.latitude || '',
        status: 'pending',
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
      Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ');
    } finally {
      console.log('Setting submitting to false');
      setSubmitting(false);
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
                  disabled={submitting}
                  onPress={handleSubmit}
                  style={[
                    styles.submitButton,
                    submitting && styles.submitButtonDisabled,
                  ]}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? 'جاري الإرسال...' : 'إرسال الشكوى'}
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
