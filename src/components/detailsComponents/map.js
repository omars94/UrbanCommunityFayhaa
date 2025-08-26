import MapView, { Marker } from 'react-native-maps';
import { View, StyleSheet, Alert, Linking, Dimensions } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

const { width } = Dimensions.get('window');


export const DisplayMap = ({ lat, long }) => {
    return (
    <View style={styles.mapContainer}>
        <MapView
        provider="google"
        scrollEnabled={true}
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
        <Marker
            coordinate={{
            latitude: Number(lat),
            longitude: Number(long),
            }}
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