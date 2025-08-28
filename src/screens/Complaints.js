import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  // Dimensions,
  Image,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useSelector, useDispatch } from 'react-redux';
import SimplePicker from '../components/SimplePicker';
import { ROUTE_NAMES, COLORS, ROLES, COMPLAINT_STATUS, COMPLAINT_STATUS_AR, SPACING, FONT_SIZES, BORDER_RADIUS, FONT_WEIGHTS } from '../constants';
// import database from '@react-native-firebase/database';
import moment from 'moment';
import { fetchComplaints } from '../api/complaintsApi';
import { setComplaints } from '../slices/complaintsSlice';

// const { width, height } = Dimensions.get('window');

export default function ComplaintsScreen() {
  const navigation = useNavigation();
  // const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const dispatch = useDispatch();
  const complaints = useSelector(state => state.complaints.complaints)
  const { areas, indicators } = useSelector(state => state.data);
  const user = useSelector(state => state.user.user);

  // Get role-based filter options
  const getFilterOptions = () => {
    const baseOptions = [
      { id: 'my', label: 'شكاواي', value: 'my' }
    ];

    switch (user?.role) {
      case ROLES.ADMIN:
        return [
          { id: 'pending', label: COMPLAINT_STATUS_AR.PENDING, value: 'pending' },
          { id: 'all', label: 'جميع الشكاوى', value: 'all' },
          { id: 'assigned', label: COMPLAINT_STATUS_AR.ASSIGNED, value: 'assigned' },
          { id: 'resolved', label: COMPLAINT_STATUS_AR.RESOLVED, value: 'resolved' },
          { id: 'completed', label: COMPLAINT_STATUS_AR.COMPLETED, value: 'completed' },
          { id: 'rejected', label: COMPLAINT_STATUS_AR.REJECTED, value: 'rejected' },
          ...baseOptions,
        ];

      case ROLES.MANAGER:
        return [
          { id: 'assigned_to_me', label: 'المُعيّنة لي', value: 'assigned_to_me' },
          { id: 'assigned_by_me', label: 'عيّنتها للعمال', value: 'assigned_by_me' },
          { id: 'resolved_by_me', label: 'حلّيتها', value: 'resolved_by_me' },
          ...baseOptions
        ];

      case ROLES.WORKER:
        return [
          { id: 'assigned_to_me', label: 'المُعيّنة لي', value: 'assigned_to_me' },
          { id: 'resolved_by_me', label: 'حلّيتها', value: 'resolved_by_me' },
          ...baseOptions
        ];

      case ROLES.CITIZEN:
      default:
        return [{ id: 'my', label: 'شكاواي', value: 'my' }];
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getComplaints();
    setRefreshing(false);
  };

  // Enhanced filtering logic
  const filteredComplaints = useMemo(() => {
    let filtered = complaints.filter(item => {
      // Area filter
      let areaMatch = selectedArea ? item.area_id === selectedArea.id : true;
      // Indicator filter
      let indicatorMatch = selectedIndicator ? item.indicator_id === selectedIndicator.id : true;

      if (!areaMatch || !indicatorMatch) return false;

      // Role-based filter logic
      switch (selectedFilter) {
        case 'my':
          return item.user_id === user.id;

        case 'pending':
          return item.status === COMPLAINT_STATUS.PENDING;

        case 'assigned':
          return item.status === COMPLAINT_STATUS.ASSIGNED;

        case 'resolved':
          return item.status === COMPLAINT_STATUS.RESOLVED;

        case 'completed':
          return item.status === COMPLAINT_STATUS.COMPLETED;

        case 'rejected':
          return item.status === COMPLAINT_STATUS.REJECTED;

        case 'assigned_to_me':
          return (user?.role === ROLES.MANAGER && item.manager_assignee_id === user.id) ||
            (user?.role === ROLES.WORKER && item.worker_assignee_id === user.id);

        case 'assigned_by_me':
          return (user?.role === ROLES.MANAGER && item.manager_assignee_id === user.id) ||
            (user?.role === ROLES.ADMIN) &&
            item.worker_assignee_id; // Manager assigned to worker

        case 'resolved_by_me':
          return ((user?.role === ROLES.MANAGER && item.manager_assignee_id === user.id) ||
            (user?.role === ROLES.WORKER && item.worker_assignee_id === user.id)) &&
            (item.status === COMPLAINT_STATUS.RESOLVED || item.status === COMPLAINT_STATUS.COMPLETED);

        case 'all':
        default:
          // For CITIZEN, show only their complaints
          if (user?.role === ROLES.CITIZEN) {
            return item.user_id === user.id;
          }
          return true;
      }
    });

    // Sort by created_at (newest to oldest)
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [complaints, selectedArea, selectedIndicator, selectedFilter, user]);

  const getComplaints = async () => {
    setLoading(true);
    try {
      // const complaintsArray = await fetchComplaints();
      fetchComplaints(dispatch,setComplaints);
    } catch (error) {
      console.error('خطأ في جلب الشكاوى:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء جلب الشكاوى');
    } finally {
      setLoading(false);
    }
  };

  // Initialize filter based on user role
  useEffect(() => {
    if (user?.role === ROLES.CITIZEN) {
      setSelectedFilter('my');
    } else if (user?.role === ROLES.ADMIN) {
      setSelectedFilter('pending');
    } else if (user?.role === ROLES.MANAGER || user?.role === ROLES.WORKER) {
      setSelectedFilter('assigned_to_me');
    }
  }, [user]);

  // Refresh complaints when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      getComplaints();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const getStatusText = (status) => {
    switch (status) {
      case COMPLAINT_STATUS.PENDING:
        return COMPLAINT_STATUS_AR.PENDING;
      case COMPLAINT_STATUS.ASSIGNED:
        return COMPLAINT_STATUS_AR.ASSIGNED;
      case COMPLAINT_STATUS.RESOLVED:
        return (user?.role === ROLES.CITIZEN) ? COMPLAINT_STATUS_AR.ASSIGNED : COMPLAINT_STATUS_AR.RESOLVED;
      case COMPLAINT_STATUS.COMPLETED:
        return (user?.role === ROLES.CITIZEN) ? COMPLAINT_STATUS_AR.RESOLVED : COMPLAINT_STATUS_AR.COMPLETED;
      case COMPLAINT_STATUS.REJECTED:
        return COMPLAINT_STATUS_AR.REJECTED;
      default:
        return 'غير محدد';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case COMPLAINT_STATUS.PENDING:
        return COLORS.status.pending;
      case COMPLAINT_STATUS.ASSIGNED:
        return COLORS.status.assigned;
      case COMPLAINT_STATUS.RESOLVED:
        return (user?.role === ROLES.CITIZEN) ? COLORS.status.assigned : COLORS.status.resolved;
      case COMPLAINT_STATUS.COMPLETED:
        return (user?.role === ROLES.CITIZEN) ? COLORS.status.resolved : COLORS.status.completed;
      case COMPLAINT_STATUS.REJECTED:
        return COLORS.status.rejected;
      default:
        return { background: COLORS.gray[200], text: COLORS.gray[600] };
    }
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    const defaultFilter = user?.role === ROLES.CITIZEN ? 'my' :
      user?.role === ROLES.ADMIN ? 'pending' : 'assigned_to_me';
    return selectedArea || selectedIndicator || selectedFilter !== defaultFilter;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedArea(null);
    setSelectedIndicator(null);
    if (user?.role === ROLES.CITIZEN) {
      setSelectedFilter('my');
    } else if (user?.role === ROLES.ADMIN) {
      setSelectedFilter('pending');
    } else {
      setSelectedFilter('assigned_to_me');
    }
  };

  const renderComplaint = ({ item }) => {
    const {
      // user_id,
      indicator_id,
      area_id,
      description,
      status,
      photo_url,
      created_at,
      // updated_at,
      // latitude,
      // longitude,
      // manager_assignee_id,
      // worker_assignee_id,
      // resolved_photo_url,
      // resolved_at
    } = item;

    const area = areas.find(a => a.id === area_id);
    const indicator = indicators.find(i => i.id === indicator_id);
    const statusColor = getStatusColor(status);

    return (
      <TouchableOpacity
        style={styles.complaintCard}
        onPress={() =>
          navigation.navigate(ROUTE_NAMES.COMPLAINT_DETAILS, { complaint: item })
        }
      >
        {/* Status Strip */}
        {/* <View style={[styles.statusStrip, { backgroundColor: statusColor.background }]} /> */}

        <View style={styles.cardContainer}>
          {/* Right Image */}
          {(photo_url) && (
            <View style={styles.imageSection}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: photo_url }}
                  // source={{ uri: resolved_photo_url || photo_url }}
                  style={styles.complaintImage}
                  resizeMode="cover"
                />
                {/* {resolved_photo_url && photo_url && (
                  <View style={styles.imageOverlay}>
                    <Text style={styles.imageOverlayText}>بعد الحل</Text>
                  </View>
                )} */}
              </View>

              {/* Secondary Image */}
              {/* {resolved_photo_url && photo_url && (
                <View style={styles.secondaryImageContainer}>
                  <Image
                    source={{ uri: photo_url }}
                    style={styles.secondaryImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.secondaryImageText}>قبل</Text>
                </View>
              )} */}
            </View>
          )}

          {/* Left Content */}
          <View style={styles.leftContent}>
            {/* Top Section */}
            <View style={styles.topSection}>
              {/* Location Section */}
              <View style={styles.locationSection}>
                <Icon name="location-outline" size={16} color={COLORS.primary} />
                <Text style={styles.areaText}>{area?.name_ar || 'غير محدد'}</Text>
              </View>
              {/* Status Badge - Top Left */}
              <View style={[styles.statusBadge, { backgroundColor: statusColor.background }]}>
                <Text style={[styles.statusText, { color: statusColor.text }]} numberOfLines={1}>
                  {getStatusText(status)}
                </Text>
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.indicatorTitle} numberOfLines={2} ellipsizeMode='tail'>
                {indicator?.description_ar || 'غير محدد'}
              </Text>
            </View>

            {/* Location Section */}
            {/* <View style={styles.locationSection}>
              <Text style={styles.areaText}>{area?.name_ar || 'غير محدد'}</Text>
              <Icon name="location-outline" size={16} color={COLORS.primary} />
            </View> */}

            {/* Description */}
            <Text style={styles.description} numberOfLines={1} ellipsizeMode='tail'>
              {description || 'لا يوجد وصف'}
            </Text>

            {/* Footer Info */}
            <View style={styles.footerInfo}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>
                  {moment(created_at).format('DD/MM/YYYY - hh:mm A')}
                </Text>
                <Icon name="time-outline" size={10} color={COLORS.text.secondary} />
              </View>

              {/* {resolved_at && (
                <View style={styles.resolvedContainer}>
                  <Text style={styles.resolvedText}>
                    تم الحل: {moment(resolved_at).format('DD/MM/YYYY')}
                  </Text>
                  <Icon name="checkmark-circle" size={14} color={COLORS.success} />
                </View>
              )} */}

              {/* Assignment Tags */}
              {/* {(manager_assignee_id || worker_assignee_id) && (
                <View style={styles.assignmentTags}>
                  {manager_assignee_id && (
                    <View style={styles.assignmentTag}>
                      <Text style={styles.assignmentText} numberOfLines={1}>مُعيّن للمدير</Text>
                      <MaterialIcon name="person" size={12} color={COLORS.primary} />
                    </View>
                  )}
                  {worker_assignee_id && (
                    <View style={styles.assignmentTag}>
                      <Text style={styles.assignmentText} numberOfLines={1}>مُعيّن للعامل</Text>
                      <MaterialIcon name="build" size={12} color={COLORS.primary} />
                    </View>
                  )}
                </View>
              )} */}
            </View>
          </View>
        </View>

        {/* Progress Indicator */}
        {/* <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: status === COMPLAINT_STATUS.PENDING ? '25%' :
                    status === COMPLAINT_STATUS.ASSIGNED ? '50%' :
                      status === COMPLAINT_STATUS.RESOLVED ? '75%' : '100%',
                  backgroundColor: statusColor.text
                }
              ]}
            />
          </View>
        </View> */}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="document-text-outline" size={60} color={COLORS.gray[400]} />
      <Text style={styles.emptyText}>لا توجد شكاوى</Text>
      <Text style={styles.emptySubText}>
        {user?.role === ROLES.CITIZEN
          ? 'لم تقم بتقديم أي شكاوى بعد'
          : 'لا توجد شكاوى مطابقة للفلاتر المحددة'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>جاري تحميل الشكاوى...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الشكاوى</Text>
        <Text style={styles.headerSubtitle}>تابع حالة شكواك خطوة بخطوة</Text>
      </View>
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterContent}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
            style={styles.filtersContainer}
          >
            {/* Role-based Filter */}
            {user?.role !== ROLES.CITIZEN && (
              <SimplePicker
                label="نوع الشكاوى"
                options={getFilterOptions()}
                labelKey="label"
                selectedValue={getFilterOptions().find(opt => opt.value === selectedFilter)?.label}
                onValueChange={(item) => setSelectedFilter(item.value)}
                style={styles.filterPicker}
                showLabel={false}
              />
            )}

            {/* Area Filter */}
            <SimplePicker
              label="المنطقة"
              options={areas}
              labelKey="name_ar"
              selectedValue={selectedArea?.name_ar}
              onValueChange={setSelectedArea}
              style={styles.filterPicker}
              showLabel={false}
            />

            {/* Indicator Filter */}
            <SimplePicker
              label="المؤشر"
              options={indicators}
              labelKey="description_ar"
              selectedValue={selectedIndicator?.description_ar}
              onValueChange={setSelectedIndicator}
              style={styles.filterPicker}
              showLabel={false}
            />
          </ScrollView>

          {/* Clear Filters Icon */}
          {hasActiveFilters() && (
            <TouchableOpacity
              style={styles.clearFilterIcon}
              onPress={clearAllFilters}
            >
              <Icon name="close-circle" size={28} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>
        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredComplaints.length} شكاوى
          </Text>
        </View>
      </View>



      {/* Complaints List */}
      <FlatList
        data={filteredComplaints}
        style={styles.flatList}
        keyExtractor={item => item.id.toString()}
        renderItem={renderComplaint}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredComplaints.length === 0 ? styles.emptyListContent : styles.listContent}
      />

      {/* Add Complaint FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate(ROUTE_NAMES.ADD_COMPLAINT)}
      >
        {/* <Icon name="add" size={28} color={COLORS.white} /> */}
        <MaterialDesignIcons name="camera-plus-outline" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
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
    paddingTop: SPACING.xxxl,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    textAlign: 'center',
  },

  // Filter Bar Styles
  filterBar: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    // shadowColor: COLORS.shadow,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    elevation: 3,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  filtersContainer: {
    flex: 1,
  },
  filterScrollContent: {
    alignItems: 'center',
    paddingRight: SPACING.md,
  },
  filterPicker: {
    marginRight: SPACING.sm,
    // maxWidth: 140, // ✅ limit width
    // flexShrink: 1, // ✅ allow shrinking instead of pushing out
  },
  clearFilterIcon: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Results Counter
  resultsContainer: {
    backgroundColor: COLORS.white,
    paddingTop: SPACING.sm,
    // paddingHorizontal: SPACING.md,
    // borderBottomWidth: 1,
    // borderBottomColor: COLORS.gray[100],
    // borderBottomEndRadius: BORDER_RADIUS.lg,
    // borderBottomStartRadius: BORDER_RADIUS.lg,
  },
  resultsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'right',
  },

  // List Styles
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Complaint Card Styles
  complaintCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    // shadowColor: COLORS.shadow,
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.12,
    // shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  statusStrip: {
    height: 4,
    width: '100%',
  },
  cardContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    minHeight: 140,
  },

  // Right Content (Image Section) - appears first in RTL
  imageSection: {
    width: 128,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    // marginRight: SPACING.md,
  },

  // Left Content (Text Section) - appears second in RTL
  leftContent: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  topSection: {
    // alignItems: 'flex-end',
    marginBottom: SPACING.xs,
    flexDirection: 'row',
    justifyContent: "space-between",
  },
  titleSection: {
    marginBottom: SPACING.xs,
    writingDirection: "rtl"
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    // marginBottom: SPACING.md,
  },
  indicatorTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text.primary,
    // textAlign: 'auto',
    lineHeight: 22,
  },
  areaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '700',
    // textAlign: 'right',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    // minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    textAlign: 'auto',
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },

  // Footer Info
  footerInfo: {
    gap: SPACING.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dateText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    fontWeight: '500',
    marginLeft: 4,
  },
  resolvedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  resolvedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  assignmentTags: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  assignmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  assignmentText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Image Container Styles
  imageContainer: {
    position: 'relative',
    width: 128,
    height: 128,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  complaintImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.success + 'CC',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
  },
  imageOverlayText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryImageContainer: {
    position: 'relative',
    width: 60,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.gray[300],
  },
  secondaryImage: {
    width: '100%',
    height: '100%',
  },
  secondaryImageText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.warning + 'CC',
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 2,
  },

  // Progress Bar
  progressContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // FAB Styles
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },

//   // Filter Bar Styles
//   filterBar: {
//     backgroundColor: COLORS.white,
//     paddingVertical: SPACING.md,
//     paddingHorizontal: SPACING.sm,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.gray[200],
//     shadowColor: COLORS.shadow,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   filterScrollContent: {
//     alignItems: 'center',
//     paddingRight: SPACING.md,
//   },
//   filterPicker: {
//     marginRight: SPACING.sm,
//   },
//   clearFilterButton: {
//     backgroundColor: COLORS.danger,
//     paddingVertical: SPACING.sm,
//     paddingHorizontal: SPACING.md,
//     borderRadius: BORDER_RADIUS.sm,
//     marginTop: SPACING.sm,
//     alignSelf: 'center',
//   },
//   clearFilterText: {
//     color: COLORS.white,
//     fontWeight: '600',
//     fontSize: FONT_SIZES.sm,
//     textAlign: 'center',
//   },

//   // Results Counter
//   resultsContainer: {
//     backgroundColor: COLORS.white,
//     paddingVertical: SPACING.sm,
//     paddingHorizontal: SPACING.md,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.gray[100],
//   },
//   resultsText: {
//     fontSize: FONT_SIZES.sm,
//     color: COLORS.text.secondary,
//     textAlign: 'right',
//   },

//   // List Styles
//   flatList: {
//     flex: 1,
//   },
//   listContent: {
//     paddingBottom: 100,
//   },
//   emptyListContent: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },

//   // Complaint Card Styles
//   complaintCard: {
//     backgroundColor: COLORS.white,
//     marginHorizontal: SPACING.md,
//     marginVertical: SPACING.sm,
//     borderRadius: BORDER_RADIUS.md,
//     shadowColor: COLORS.shadow,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.12,
//     shadowRadius: 8,
//     elevation: 5,
//     overflow: 'hidden',
//   },
//   statusStrip: {
//     height: 4,
//     width: '100%',
//   },
//   cardContainer: {
//     flexDirection: 'row',
//     padding: SPACING.lg,
//     minHeight: 140,
//   },

//   // Left Content
//   leftContent: {
//     flex: 1,
//     marginLeft: SPACING.md,
//     justifyContent: 'space-between',
//   },
//   topSection: {
//     alignItems: 'flex-start',
//     marginBottom: SPACING.sm,
//   },
//   titleSection: {
//     marginBottom: SPACING.sm,
//     writingDirection: "rtl"
//   },
//   locationSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-start',
//     marginBottom: SPACING.md,
//   },
//   indicatorTitle: {
//     fontSize: FONT_SIZES.lg,
//     fontWeight: '700',
//     color: COLORS.text.primary,
//     // textAlign: 'auto',
//     lineHeight: 24,
//   },
//   areaText: {
//     fontSize: FONT_SIZES.md,
//     color: COLORS.primary,
//     fontWeight: '600',
//     // textAlign: 'right',
//     marginLeft: 4,
//   },
//   statusBadge: {
//     paddingHorizontal: SPACING.md,
//     paddingVertical: SPACING.sm,
//     borderRadius: BORDER_RADIUS.lg,
//     minWidth: 80,
//     alignItems: 'center',
//   },
//   statusText: {
//     fontSize: FONT_SIZES.sm,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   description: {
//     fontSize: FONT_SIZES.md,
//     color: COLORS.text.primary,
//     textAlign: 'auto',
//     lineHeight: 22,
//     marginBottom: SPACING.md,
//   },

//   // Footer Info
//   footerInfo: {
//     gap: SPACING.sm,
//   },
//   dateContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-end',
//   },
//   dateText: {
//     fontSize: FONT_SIZES.sm,
//     color: COLORS.text.secondary,
//     fontWeight: '500',
//     marginLeft: 4,
//   },
//   resolvedContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-end',
//   },
//   resolvedText: {
//     fontSize: FONT_SIZES.sm,
//     color: COLORS.success,
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   assignmentTags: {
//     flexDirection: 'row',
//     gap: SPACING.sm,
//     justifyContent: 'flex-end',
//     flexWrap: 'wrap',
//   },
//   assignmentTag: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.primary + '15',
//     paddingHorizontal: SPACING.sm,
//     paddingVertical: 4,
//     borderRadius: BORDER_RADIUS.sm,
//     borderWidth: 1,
//     borderColor: COLORS.primary + '30',
//   },
//   assignmentText: {
//     fontSize: FONT_SIZES.xs,
//     color: COLORS.primary,
//     fontWeight: '600',
//     marginLeft: 4,
//   },

//   // Right Image Section
//   imageSection: {
//     width: 110,
//     alignItems: 'center',
//     gap: SPACING.sm,
//   },
//   imageContainer: {
//     position: 'relative',
//     width: 110,
//     height: 110,
//     borderRadius: BORDER_RADIUS.md,
//     overflow: 'hidden',
//     shadowColor: COLORS.shadow,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   complaintImage: {
//     width: '100%',
//     height: '100%',
//   },
//   imageOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: COLORS.success + 'CC',
//     paddingVertical: 4,
//     paddingHorizontal: SPACING.sm,
//   },
//   imageOverlayText: {
//     color: COLORS.white,
//     fontSize: FONT_SIZES.xs,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   secondaryImageContainer: {
//     position: 'relative',
//     width: 60,
//     height: 40,
//     borderRadius: BORDER_RADIUS.sm,
//     overflow: 'hidden',
//     borderWidth: 2,
//     borderColor: COLORS.gray[300],
//   },
//   secondaryImage: {
//     width: '100%',
//     height: '100%',
//   },
//   secondaryImageText: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: COLORS.warning + 'CC',
//     color: COLORS.white,
//     fontSize: 10,
//     fontWeight: '600',
//     textAlign: 'center',
//     paddingVertical: 2,
//   },

//   // Progress Bar
//   progressContainer: {
//     paddingHorizontal: SPACING.lg,
//     paddingBottom: SPACING.md,
//   },
//   progressBar: {
//     height: 4,
//     backgroundColor: COLORS.gray[200],
//     borderRadius: 2,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     borderRadius: 2,
//   },

//   // Loading Styles
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: COLORS.background,
//   },
//   loadingText: {
//     marginTop: SPACING.md,
//     fontSize: FONT_SIZES.lg,
//     color: COLORS.text.secondary,
//     textAlign: 'center',
//   },

//   // Empty State
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: SPACING.xl,
//   },
//   emptyText: {
//     fontSize: FONT_SIZES.xl,
//     fontWeight: '600',
//     color: COLORS.text.secondary,
//     textAlign: 'center',
//     marginBottom: SPACING.sm,
//   },
//   emptySubText: {
//     fontSize: FONT_SIZES.md,
//     color: COLORS.text.secondary,
//     textAlign: 'center',
//     lineHeight: 22,
//   },

//   // FAB Styles
//   fab: {
//     position: 'absolute',
//     right: SPACING.xl,
//     bottom: SPACING.xl,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: COLORS.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: COLORS.shadowDark,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   fabIcon: {
//     color: COLORS.white,
//     fontSize: 32,
//     lineHeight: 32,
//     fontWeight: '300',
//   },
// });