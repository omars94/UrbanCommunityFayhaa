import MapView, { Geojson, Marker } from 'react-native-maps';
import { View, StyleSheet, Alert, Linking, Dimensions } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, ROLES } from '../../constants';
// import Sections from '../../constants/Sections.json';
import { findContainingFeature } from '../../services/mapService';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

export const DisplayMap = ({ lat, long, resolvedLat, resolvedLong }) => {
  const Sections = useSelector(state => state.sections.sections);
  const user = useSelector(state => state.user.user);
  const match = findContainingFeature({ long, lat });
  return (
    <View style={styles.mapContainer}>
      <MapView
        provider="google"
        scrollEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        style={styles.map}
        initialRegion={{
          latitude: Number(lat),
          longitude: Number(long),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {Sections &&
          user?.role !== ROLES.CITIZEN &&
          user?.role !== ROLES.WORKER && (
            <Geojson
              geojson={Sections}
              strokeColor={COLORS.secondary}
              title=""
              fillColor={COLORS.primary + '22'}
              strokeWidth={1}
            />
          )}
        {/* Red marker for original coordinates */}
        <Marker
          coordinate={{
            latitude: Number(lat),
            longitude: Number(long),
          }}
          pinColor="red"
          title={match?.properties?.admin3na_1 ?? 'موقع الشكوى'}
          // description="الإحداثيات الأصلية"
          onPress={() => {
            Alert.alert('تأكيد', 'هل تريد فتح الموقع في خرائط جوجل؟', [
              { text: 'إلغاء', style: 'cancel' },
              {
                text: 'فتح',
                onPress: () => {
                  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${long}`;
                  Linking.openURL(url);
                },
              },
            ]);
          }}
        />

        {/* Green marker for resolved coordinates (only show if different from original) */}
        {resolvedLat && resolvedLong && (
          <Marker
            coordinate={{
              latitude: Number(resolvedLat),
              longitude: Number(resolvedLong),
            }}
            pinColor="green"
            title="الموقع المحلول"
            description="الإحداثيات المحلولة"
            onPress={() => {
              Alert.alert(
                'تأكيد',
                'هل تريد فتح الموقع المحلول في خرائط جوجل؟',
                [
                  { text: 'إلغاء', style: 'cancel' },
                  {
                    text: 'فتح',
                    onPress: () => {
                      const url = `https://www.google.com/maps/search/?api=1&query=${resolvedLat},${resolvedLong}`;
                      Linking.openURL(url);
                    },
                  },
                ],
              );
            }}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: width - SPACING.xxxl * 2,
    height: 250,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    position: 'relative',
    backgroundColor: COLORS.location,
  },
  map: {
    flex: 1,
  },
});
