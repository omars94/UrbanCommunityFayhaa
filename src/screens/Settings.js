import React, { useCallback } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking } from "react-native";
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from "@react-navigation/native";
import { ROUTE_NAMES, COLORS, ROLES, BORDER_RADIUS, SPACING, FONT_SIZES, FONT_WEIGHTS, SIZES, FONT_FAMILIES } from "../constants";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from '../slices/userSlice';
import auth from '@react-native-firebase/auth';
import HeaderSection from "../components/headerSection";


export default function SettingsScreen() {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { user } = useSelector(state => state.user);
    console.log(user);

    const phone = user?.phone_number;
    const fullname = user?.full_name;
    const role = user?.role;
    let role_text = '';
    switch (role) {
        case 1:
            role_text = 'مدير النظام';
            break;
        case 2:
            role_text = 'مسؤول';
            break;
        case 3:
            role_text = 'موظف';
            break;
        default: role_text = 'مواطن';
    }

    const getInitials = (name) => {
        if (!name) return "";

        const nameParts = name.split(' ');
        let initials = '';

        // Take first letter of first two parts
        for (let i = 0; i < Math.min(2, nameParts.length); i++) {
            if (nameParts[i].length > 0) {
                initials += nameParts[i][0];
            }
        }

        return initials || "";
    };

    const signOut = async () => {
        try {
            await auth().signOut();
            dispatch(clearUser());
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <View style={styles.container}>
            {/* <View style={styles.header}>
                <Text style={styles.headerTitle}>الإعدادات</Text>
                {role === ROLES.ADMIN &&
                    <Text style={styles.headerSubtitle}>إدارة النظام والمستخدمين</Text>
                }
            </View> */}
            <HeaderSection
                title='الإعدادات'
                subtitle={role === ROLES.ADMIN ? 'إدارة النظام والمستخدمين' : ''}
            />

            <ScrollView contentContainerStyle={styles.scroll}>

                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(fullname)}</Text>
                    </View>
                    <View>
                        <Text style={styles.profileName}>{fullname}</Text>
                        <Text style={styles.profileInfo}>{role_text} • {phone}</Text>
                    </View>
                </View>

                <MenuItem
                    icon="person"
                    label="تعديل الملف الشخصي"
                    subLabel="تعديل المعلومات الشخصية"
                    onPress={() => navigation.navigate(ROUTE_NAMES.PROFILE)}
                />
                {role === ROLES.ADMIN &&
                    <MenuItem
                        icon="book"
                        label="إدارة المديرين"
                        subLabel="إضافة وإدارة المدراء"
                        onPress={() => navigation.navigate(ROUTE_NAMES.ADD_MANAGER)}
                    />}
                {(role === ROLES.ADMIN || role === ROLES.MANAGER) &&
                    <MenuItem
                        icon="people"
                        label="إدارة الموظفين"
                        subLabel="إضافة وإدارة موظفي النظام"
                        onPress={() => navigation.navigate(ROUTE_NAMES.ADD_WORKER)}
                    />}
                {role === ROLES.ADMIN &&
                    <MenuItem
                        icon="bar-chart"
                        label="إحصاءات النظام"
                        subLabel="عرض تقارير الأداء"
                        onPress={() => console.log("Go to stats")}
                    />}
                <MenuItem
                    icon="call"
                    label="اتصل بالدعم"
                    subLabel="احصل على مساعدة"
                    onPress={() => Linking.openURL('tel:175')}
                />
                <MenuItem
                    icon="log-out"
                    label="تسجيل خروج"
                    subLabel="تسجيل الخروج من حسابك"
                    onPress={() => signOut()}
                />
            </ScrollView>
        </View>
    );
}

function MenuItem({ icon, label, subLabel, onPress }) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <Ionicons name={icon} size={22} color="#444" style={styles.menuIcon} />
            <View>
                <Text style={styles.menuLabel}>{label}</Text>
                <Text style={styles.menuSubLabel}>{subLabel}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    scroll: { padding: SPACING.md },
    profileCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: SIZES.avatar.md,
        height: SIZES.avatar.md,
        borderRadius: SIZES.avatar.md / 2,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: SPACING.md,
    },
    avatarText: {
        color: COLORS.white,
        fontWeight: FONT_WEIGHTS.bold,
        fontSize: FONT_SIZES.lg
    },
    profileName: {
        fontSize: FONT_SIZES.xl,
        fontWeight: FONT_WEIGHTS.bold,
        marginBottom: SPACING.xs
    },
    profileInfo: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray[600]
    },
    menuItem: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.md,
        padding: FONT_SIZES.md,
        marginBottom: SPACING.sm,
        flexDirection: "row",
        alignItems: "center",
        elevation: 2,
    },
    menuIcon: { marginRight: SPACING.md },
    menuLabel: {
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.semibold,
        color: COLORS.black,
    },
    menuSubLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray[600]
    },
});