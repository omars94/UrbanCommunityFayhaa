import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import moment from 'moment';
import { DisplayMap } from '../detailsComponents/map';
import ImageSlider from '../detailsComponents/imageSlider';
import StatusTimeline from '../detailsComponents/timeline';
import {
  BORDER_RADIUS,
  COLORS,
  COMPLAINT_STATUS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  ROLES,
  SHADOWS,
  SPACING,
} from '../../constants';

/**
 * ComplaintDetailsSections
 * -----------------------
 * Pure UI component that renders the main body of the details screen:
 * images, status/timeline, info rows, map, description, and rejection/denial reasons.
 *
 * Keeping it separate makes `src/screens/details.js` focus on:
 * - state + realtime listeners
 * - actions (assign/resolve/complete/reject/deny)
 * - notifications + permissions flow
 *
 * Props:
 * - complaint: initial complaint object (route param fallback)
 * - complaintData: live complaint object (from realtime listener)
 * - status: current status string
 * - userRole: number
 * - refreshing: boolean
 * - onRefresh: () => void
 * - shouldRenderMap: boolean
 * - getStatusColor: (status: string) => { bg: string, text: string }
 * - getStatusText: (status: string) => string
 * - getTimeAgo: (timestamp: any) => string
 */
export default function ComplaintDetailsSections({
  complaint,
  complaintData,
  status,
  userRole,
  refreshing,
  onRefresh,
  shouldRenderMap,
  getStatusColor,
  getStatusText,
  getTimeAgo,
}) {
  const data = complaintData || complaint || {};

  const denialReason =
    data.denial_reason || data.deny_reason || data.denialReason || '';
  const rejectionReason =
    data.rejection_reason || data.reject_reason || data.rejectionReason || '';

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.contentContainer}>
        <View style={styles.section}>
          <ImageSlider complaint={data} />
        </View>

        <View style={styles.section}>
          <View style={styles.statusHeader}>
            <Text style={styles.sectionTitle}>حالة الشكوى</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(status).bg },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(status).text },
                ]}
              >
                {getStatusText(status)}
              </Text>
            </View>
          </View>

          <StatusTimeline
            complaint={data}
            status={status}
            getTimeAgo={getTimeAgo}
            userRole={userRole}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>نوع المشكلة</Text>
          <Text style={styles.descriptionText}>
            {data.indicator_name || 'غير محدد'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات الشكوى</Text>

          <View style={styles.infoRow}>
            <Ionicons
              name="calendar"
              size={20}
              color={COLORS.secondary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>تاريخ التقديم</Text>
            <Text style={styles.infoValue}>
              {data.created_at
                ? moment(data.created_at).format('DD/MM/YYYY hh:mm A')
                : 'غير محدد'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="location"
              size={20}
              color={COLORS.red}
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>المنطقة</Text>
            <Text style={styles.infoValue}>{data.area_name || 'غير محدد'}</Text>
          </View>

          {!!data.user_name && (
            <View style={styles.infoRow}>
              <Ionicons
                name="person"
                size={20}
                color="#2E86AB"
                style={styles.infoIcon}
              />
              <Text style={styles.infoLabel}>مقدم الشكوى</Text>
              <Text style={styles.infoValue}>{data.user_name}</Text>
            </View>
          )}

          {(userRole === ROLES.ADMIN ||
            userRole === ROLES.MANAGER ||
            userRole === ROLES.SUPERVISOR) &&
            data.worker_name && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="construct"
                  size={20}
                  color="#2E86AB"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoLabel}>العامل المسؤول</Text>
                <Text style={styles.infoValue}>
                  {Array.isArray(data.worker_name)
                    ? data.worker_name[data.worker_name.length - 1]
                    : data.worker_name}
                </Text>
              </View>
            )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="map"
              size={20}
              color="#2E86AB"
              style={styles.sectionHeaderIcon}
            />
            <Text style={styles.sectionTitle}>الموقع على الخريطة</Text>
          </View>
          <View style={styles.locationContainer}>
            {shouldRenderMap && (
              <DisplayMap
                lat={data.latitude}
                long={data.longitude}
                resolvedLat={data.resolved_lat}
                resolvedLong={data.resolved_long}
                status={status}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialDesignIcons
              name="text-box"
              size={20}
              color="#2E86AB"
              style={styles.sectionHeaderIcon}
            />
            <Text style={styles.sectionTitle}>وصف المشكلة</Text>
          </View>
          <Text style={styles.descriptionText}>
            {data.description || 'لا يوجد وصف متاح'}
          </Text>
        </View>

        {status === COMPLAINT_STATUS.DENIED && !!denialReason && (
          <View style={[styles.section, styles.rejectionSection]}>
            <Text style={[styles.sectionTitle, styles.rejectionTitle]}>
              سبب رفض الحل
            </Text>
            <Text style={styles.rejectionReasonText}>{denialReason}</Text>
            {!!data.denied_at && (
              <Text style={styles.rejectionDate}>
                تاريخ الرفض: {getTimeAgo(data.denied_at)}
              </Text>
            )}
          </View>
        )}

        {status === COMPLAINT_STATUS.REJECTED && !!rejectionReason && (
          <View style={[styles.section, styles.rejectionSection]}>
            <Text style={[styles.sectionTitle, styles.rejectionTitle]}>
              سبب الرفض
            </Text>
            <Text style={styles.rejectionReasonText}>{rejectionReason}</Text>
            {!!data.rejected_at && (
              <Text style={styles.rejectionDate}>
                تاريخ الرفض: {getTimeAgo(data.rejected_at)}
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.xl,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    ...SHADOWS.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
  },
  sectionHeaderIcon: {
    marginRight: 5,
    marginTop: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
  },
  statusText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.primary,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    fontFamily: FONT_FAMILIES.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  infoIcon: {
    marginRight: 5,
  },
  infoLabel: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    flex: 1,
    color: COLORS.text.primary,
    fontFamily: FONT_FAMILIES.primary,
  },
  infoValue: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    flex: 1,
    textAlign: 'right',
    fontFamily: FONT_FAMILIES.primary,
  },
  locationContainer: {
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text.primary,
    lineHeight: 24,
    fontFamily: FONT_FAMILIES.primary,
  },
  rejectionSection: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  rejectionTitle: {
    color: COLORS.danger,
  },
  rejectionReasonText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.danger,
    lineHeight: 24,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILIES.primary,
  },
  rejectionDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
    fontFamily: FONT_FAMILIES.primary,
  },
});

