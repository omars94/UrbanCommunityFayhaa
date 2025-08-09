import { AntDesign } from '@react-native-vector-icons/ant-design';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import moment from 'moment';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { Marker } from 'react-native-maps';
import { useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
const { width, height } = Dimensions.get('window');

export default function ComplaintDetails() {
  let {
    params: { complaint: data },
  } = useRoute();
  const { areas, indicators } = useSelector(state => state.data);

  const {
    latitude,
    longitude,
    area_id,
    indicator_id,
    user_id,
    status,
    description,
    photo_url,
    created_at,
    updated_at,
  } = data ?? {};
  let area = areas.find(area => area.id == area_id);
  let indicator = indicators.find(indicator => indicator.id == indicator_id);
  const { width, height } = useWindowDimensions();

  // Fullscreen image modal state
  const [imageModalVisible, setImageModalVisible] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          marginBottom: 10,
          backgroundColor: '#ecf0f1',
          borderRadius: 10,
          padding: 10,
          alignItems: 'flex-start',
          height: height * 0.4,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={3}>
            {indicator?.description_ar}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text style={styles.area}>{area?.name_ar}</Text>
            <Text style={styles.status}>
              {status === 'pending' ? 'قيد الانتظار' : 'تم الحل'}
            </Text>
          </View>
          <Text style={styles.date}>
            {moment(created_at).format('DD/MM/YYYY HH:mm')}
          </Text>
          <Text style={styles.desc}>{description}</Text>
        </View>
        <View style={{ flex: 1 }}>
          {photo_url && (
            <>
              <TouchableOpacity onPress={() => setImageModalVisible(true)}>
                <Image
                  source={{ uri: photo_url }}
                  height={200}
                  style={styles.image}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        {latitude && longitude && (
          <View style={styles.mapContainer}>
            <MapView
              // mapType='satellite'
              provider={'google'}
              scrollEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              style={styles.map}
              CameraZoomRange={{
                minCenterCoordinateDistance: 0,
                maxCenterCoordinateDistance: 1,
              }}
              initialRegion={{
                latitude: Number(latitude),
                longitude: Number(longitude),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: Number(latitude),
                  longitude: Number(longitude),
                }}
                onPress={() => {
                  Alert.alert('تأكيد', 'هل تريد فتح الموقع في خرائط جوجل؟', [
                    { text: 'إلغاء', style: 'cancel' },
                    {
                      text: 'فتح',
                      onPress: () => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                        Linking.openURL(url);
                      },
                      style: 'default',
                    },
                  ]);
                }}
              />
            </MapView>
          </View>
        )}
      </View>
      {imageModalVisible && (
        <Modal
          style={styles.fullscreenModal}
          pointerEvents="box-none"
          transparent
        >
          <GestureHandlerRootView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setImageModalVisible(false)}
            >
              <AntDesign name="closecircle" size={30} color="#FFF" />
            </TouchableOpacity>
            <ImageZoom
              uri={photo_url}
              isPanEnabled={false}
              doubleTapScale={1}
              isSingleTapEnabled={false}
              style={styles.fullscreenImage}
              // doubleTapZoomToCenter
              // onRequestClose={() => setImageModalVisible(false)}
            />
          </GestureHandlerRootView>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    textAlign: 'right',
    color: '#666',
    marginBottom: 8,
  },
  area: {
    textAlign: 'right',
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  date: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  desc: {
    fontSize: 16,
    textAlign: 'right',
    color: '#333',
    marginBottom: 16,
  },
  image: {
    borderRadius: 8,
  },
  mapContainer: {
    width: Dimensions.get('window').width - 40,
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  fullscreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,1)',
    zIndex: 100,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignSelf: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 10,
    zIndex: 9999,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
});
