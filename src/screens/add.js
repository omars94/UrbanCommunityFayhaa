import { Ionicons } from '@react-native-vector-icons/ionicons';
import { launchCamera } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from 'react-native-paper';
import { useSelector } from 'react-redux';
import SimplePicker from '../components/SimplePicker';
import { useNavigation } from '@react-navigation/native';

export default function AddComplaintScreen() {
  const navigation = useNavigation();
  const [submitting, setSubmitting] = useState(false);
  const [indicator, setIndicator] = useState(1);
  const [area, setArea] = useState(2);
  const [description, setDescription] = useState('hello world');
  const [photo, setPhoto] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const { areas, indicators } = useSelector(state => state.data);
  const { user } = useSelector(state => state.user);
  console.log(user);
  // useEffect(() => {
  //   (async () => {
  //     await ImagePicker.requestCameraPermissionsAsync();
  //     await Location.requestForegroundPermissionsAsync();
  //   })();
  // }, []);

  const takePhoto = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: true,
      includeBase64: false,
    });

    if (!result.didCancel && result.assets) {
      Geolocation.getCurrentPosition(
        position => {
          setPhoto(result.assets[0].uri);
          setMetadata({
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            timestamp: new Date().toISOString(),
          });
        },
        error => console.log(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // Validate required fields
    if (!indicator || !area || !description.trim()) {
      Alert.alert(
        'خطأ في البيانات',
        'يرجى ملء جميع الحقول المطلوبة (المؤشر، المنطقة، الوصف)',
      );
      return;
    }

    try {
      let photoUrl = null;
      if (photo) {
        console.log(photoUrl);
      }

      const complaintData = {
        indicator_id: indicator?.id,
        user_id: user.id,
        area_id: area?.id,
        description: description.trim(),
        photo_url: photoUrl,
        longitude: metadata?.location?.longitude ?? '',
        latitude: metadata?.location?.latitude ?? '',
        status: 'pending',
        // Add other fields as needed (e.g., user_id, created_at)
      };

      if (data) {
        Alert.alert('تم الحفظ بنجاح', 'تم حفظ الشكوى بنجاح', [
          {
            text: 'حسناً',
            onPress: () => navigation.back(),
          },
        ]);
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      Alert.alert(
        'خطأ في الحفظ',
        'حدث خطأ أثناء حفظ الشكوى. يرجى المحاولة مرة أخرى.',
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <View style={[styles.container]}>
      <View style={styles.content}>
        <View style={{ padding: 15, flex: 1 }}>
          <TouchableOpacity onPress={takePhoto} style={styles.photoButton}>
            {photo ? (
              <Image
                source={{ uri: photo }}
                width={200}
                height={200}
                style={styles.photoIconPreview}
              />
            ) : (
              <Ionicons name="camera-outline" size={32} color="#fff" />
            )}
          </TouchableOpacity>
          <View style={{ paddingVertical: 10, flexDirection: 'row' }}>
            <SimplePicker
              label="المؤشر"
              options={indicators}
              labelKey={'description_ar'}
              selectedValue={indicator?.description_ar}
              onValueChange={setIndicator}
            />
            <SimplePicker
              label="المنطقة"
              columns={3}
              labelKey={'name_ar'}
              options={areas}
              selectedValue={area?.name_ar}
              onValueChange={setArea}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="وصف الشكوى"
            multiline
            maxLength={300}
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>
        <Button
          disabled={submitting}
          icon="email-send"
          mode="contained"
          onPress={handleSubmit}
        >
          إرسال الشكوى
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyHeader: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    textAlign: 'right',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoButton: {
    backgroundColor: '#007bff',
    width: 150,
    height: 150,
    alignSelf: 'center',
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  photoIconPreview: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderRadius: 100,
    backgroundColor: '#eee',
  },
});
