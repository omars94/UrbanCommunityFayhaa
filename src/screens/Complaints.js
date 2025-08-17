import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import SimplePicker from '../components/SimplePicker';
import { ROUTE_NAMES } from '../constants';
import database from '@react-native-firebase/database';
import moment from 'moment';

const { width, height } = Dimensions.get('window');

export default function ComplaintsScreen() {
  const navigation = useNavigation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const { areas, indicators } = useSelector(state => state.data);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  // Filtering logic
  const filteredComplaints = complaints.filter(item => {
    let areaMatch = selectedArea ? item.area_id === selectedArea.id : true;
    let indicatorMatch = selectedIndicator
      ? item.indicator_id === selectedIndicator.id
      : true;
    return areaMatch && indicatorMatch;
  });
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const snapshot = await database().ref('/complaints').once('value');

      const complaintsData = snapshot.val();
      const complaintsArray = complaintsData
        ? Object.keys(complaintsData).map(key => ({
            id: key,
            ...complaintsData[key],
          }))
        : [];

      setComplaints(complaintsArray);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh complaints when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchComplaints();
    }, []),
  );
  const isFocused = useIsFocused();
  useEffect(() => {}, [isFocused]);

  const renderComplaint = ({ item }) => {
    const {
      user_id,
      indicator_id,
      area_id,
      description,
      status,
      photo_url,
      created_at,
      updated_at,
      latitude,
      longitude,
    } = item;
    let area = areas.find(area => area.id == area_id);
    let indicator = indicators.find(indicator => indicator.id == indicator_id);
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate(ROUTE_NAMES.COMPLAINT_DETAILS, { complaint: item })
        }
      >
        <View
          style={{
            flexDirection: 'row',
            borderWidth: 1,
            overflow: 'hidden',
            margin: 5,
            marginHorizontal: 7.5,
            minHeight: 150,
            padding: 10,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
          }}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {indicator?.description_ar}
              </Text>
              <Text style={styles.cardArea}>{area?.name_ar}</Text>
            </View>
            <View style={styles.cardHeader}>
              <Text style={styles.cardStatus}>
                {status === 'pending' ? 'قيد الانتظار' : 'تم الحل'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {moment(created_at).format('DD/MM/YYYY hh:mm A')}
              </Text>
            </View>

            <Text style={styles.cardDesc} numberOfLines={4}>
              {description}
            </Text>
          </View>
          {photo_url && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: photo_url }}
                contentFit="cover"
                placeholder={{
                  uri: 'data:image/png;base64,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EoG1C7iSWXsV7HwB2gn+FSVxXUV7v8xJPcvkiv3sipsqnlcxecWe6fyG1VUV6TyW2UYttpaUsqaze2rF8YrnVCRpwycd/LsGASOQNaDb5AmBnBBzQs+Xxe+syOOzs77rqNm9U9bdvj/IFfsfVFxY8eaKnIQTm9R5VHF/mlLudH5vqvhuxWcqJAJrEdCBrIV95zfaOo88RXVFRXvCasiTetaV0Uh+Rv62inxPsskdRxX/pymjjnQiz6g4XvHZiu9VNNealAisXkAHsnpjWzgl0E5wGW1k1JHRx1CjjlNb2T/VOpLMzfS2pXSKeVrtOxV/um07Z3/GLeD+6bjrZ5tK1zqP/GTHjRXpRDIq2MaTeu3WkaW04dyuu7Diloo8/pzE9aSDf1coYASyQlyrPiHQOo4caxl1jOGP9batalpnkQ45jz9/o+LzFc2+JiUCwwvoQIY3tcZTArk6zkktfwj3uopcKed7iXbCq0lpQIF455bgJRV5Sit/fPijCh1JIUjDC+SAkwgMLdA6iLy+q+LKinQebX5NSisSmOws3lPbeGVFnnZjvyLwXV6tEcgu1/5q9r2NOi6u1V9dsSl/rLcajfWttY1G8rcwGZHkDyvvrpjsYOqtRGB5ASOQ5e0sOVsgt6zyVFDrPHLCktYjEPvUx+kV11fkV36NRgpBGkbACGQYx11fS7uqzZNAb6rI9xyb9pfe21yHbTSSH528tCKjkZ9U6NwLQVpeQAeyvJ0lTwnkqvbqimMV+RLXiakQRpgyGsnP4N9Q8eWKuyrSuaT+JAK9BXQgvckssCfQOon2+mdkNk6g1V0KPjm9cTuiwOsR0IGsx31Ttzp5ksntkPwEyeS8Td2vXS536i+3HM/be91lC/veU0AH0hNsx7K3Wxs5ybTpEOR9vu+YnJf50uYKpE5zi6vVdeo20xKBuQI6kLk0PiiBdjL5q5rOf2qUnxJvJxknl8LYwpSOI+eFb1Z8fW//UucSAQIElhLQWSzFZiECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQGJPA/wMJVYDATxFWygAAAABJRU5ErkJggg==',
                }}
                style={styles.complaintImage}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e64e5" />
        <Text style={styles.loadingText}>جاري تحميل الشكاوى...</Text>
      </View>
    );
  }
  return (
    <View style={[styles.container]}>
      {/* Filter Bar */}
      <View
        style={[
          styles.filterBar,
          { alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            maxWidth: width * 0.8,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <SimplePicker
            columns={3}
            label="المنطقة"
            options={areas}
            labelKey={'name_ar'}
            selectedValue={selectedArea?.name_ar}
            onValueChange={setSelectedArea}
          />
          <SimplePicker
            label="المؤشر"
            options={indicators}
            labelKey={'description_ar'}
            selectedValue={selectedIndicator?.description_ar}
            onValueChange={setSelectedIndicator}
          />
        </View>

        {(selectedArea || selectedIndicator) && (
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={() => {
              setSelectedArea(null);
              setSelectedIndicator(null);
            }}
          >
            <Text style={styles.clearFilterText}>X</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={filteredComplaints}
        style={{ flex: 1 }}
        keyExtractor={item => item.id.toString()}
        renderItem={renderComplaint}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate(ROUTE_NAMES.ADD_COMPLAINT)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: {
    flex: 1,
    padding: 5,
    gap: 5,
  },
  cardHeader: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  cardTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'right' },
  cardStatus: { flex: 1, fontSize: 14, color: '#666' },
  cardArea: { fontSize: 14, color: '#333' },
  cardSubtitle: { fontSize: 12, color: '#666' },
  cardDesc: { fontSize: 14, color: '#333', textAlign: 'right' },
  imageContainer: {
    justifyContent: 'center',
    marginEnd: 5,
    alignItems: 'center',
  },
  complaintImage: {
    width: 100,
    height: 100,
    overflow: 'hidden',
    borderRadius: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2e64e5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fabIcon: { color: '#fff', fontSize: 32, lineHeight: 32 },
  testButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignSelf: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  clearFilterButton: {
    backgroundColor: '#e74c3c',
    padding: 8,
    alignSelf: 'center',
    borderRadius: 8,
  },
  clearFilterText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
