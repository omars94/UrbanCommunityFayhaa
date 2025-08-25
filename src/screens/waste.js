import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import HeaderSection from '../components/headerSection';
import { fetchWasteItems } from '../api/wasteApi';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  FONT_FAMILIES,
  BORDER_RADIUS,
  SHADOWS
} from '../constants';

const WasteScreen = ({ navigation }) => {
  const [wasteItems, setWasteItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWasteItems();
  }, []);

  const loadWasteItems = async () => {
    try {
      setLoading(true);
      const items = await fetchWasteItems();
      setWasteItems(items);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWasteItems();
    setRefreshing(false);
  };

  const handlePhonePress = (phone) => {
    const phoneNumber = phone.replace(/\s/g, '');
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('خطأ', 'لا يمكن إجراء المكالمة');
    });
  };

  const getIconComponent = (icon) => {
    // Map emoji icons to Ionicons
    const iconMap = {
      '🔋': { name: 'battery-half', color: COLORS.warning },
      '🏥': { name: 'medkit', color: COLORS.danger },
      '🏗️': { name: 'construct', color: COLORS.gray[600] },
      '🧪': { name: 'flask', color: COLORS.secondary },
      '🌱': { name: 'leaf', color: COLORS.success },
      '☢️': { name: 'nuclear', color: COLORS.warning }
    };

    const iconConfig = iconMap[icon] || { name: 'trash', color: COLORS.primary };

    return (
      // <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}15` }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${COLORS.danger}15` }]}>
        {/* <Ionicons name={iconConfig.name} size={24} color={iconConfig.color} /> */}
        <Text style={[styles.itemIcon]}>{icon}</Text>
      </View>
    );
  };

  const renderWasteItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={() => handlePhonePress(item.phone)}
    >
      {getIconComponent(item.icon)}
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title_ar}</Text>
        <Text style={styles.itemDescription}>{item.description_ar}</Text>
        <View style={styles.phoneContainer}>
          <Text style={styles.phoneText}>{`\u200E${item.phone}`}</Text>
          <Ionicons name="call"  size={14} color={COLORS.success} />
        </View>
      </View>
      {/* <Ionicons name="call" paddingRight={SPACING.md} size={20} color={COLORS.gray[400]} /> */}
    </TouchableOpacity>
  );

  const renderHeaderSection = () => (
    <HeaderSection
          title="التخلص من النفايات"
          subtitle="معلومات التخلص من النفايات الخاصة"
          showBackButton={false}
        // onBackPress={() => navigation.goBack()}
        />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeaderSection()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeaderSection()}
      <ScrollView
        style={styles.content}
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
        <View style={styles.menuItems}>
          {wasteItems.length > 0 ? (
            wasteItems.filter((item) => item.active !== false).map(renderWasteItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="trash-outline" size={60} color={COLORS.gray[400]} />
              <Text style={styles.emptyText}>لا توجد عناصر متاحة</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            اضغط على أي عنصر للاتصال بالخدمة المختصة
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  menuItems: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    // marginRight: SPACING.md,
  },
  itemIcon: {
     fontSize: 32,
  },
  itemContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  itemTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.arabic,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  itemDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILIES.arabic,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  phoneText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILIES.primary,
    color: COLORS.success,
    marginRight: SPACING.xs,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILIES.arabic,
    color: COLORS.text.secondary,
  },
  emptyContainer: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_FAMILIES.arabic,
    color: COLORS.text.secondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.info}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  infoText: {
    flex: 1,
    marginRight: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILIES.arabic,
    color: COLORS.info,
  },
})

export default WasteScreen;