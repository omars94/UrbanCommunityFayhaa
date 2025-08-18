import database from '@react-native-firebase/database';
import { ROLES } from '../constants';

export const getUserByFbUID = async (fbuid) => {
    try {
        const snapshot = await database()
            .ref('users')
            .orderByChild('firebase_uid')
            .equalTo(fbuid)
            .once('value');

        // Get the first matching user if exists
        const userData = snapshot.val();

        return userData ? Object.values(userData)[0] : null ;
    } catch (error) {
        console.log("User fetch failed:", error);
        throw error;
    }
}

export const getAllByRole = async (role) => {
    try {
        const snapshot = await database()
            .ref('users')
            .orderByChild('role')
            .equalTo(role)
            .once('value');

        return snapshot.val();
    } catch (error) {
        throw error;
    }
}

export const promoteToRole = async (id, role) => {
    try {
        const snapshot = await database()
            .ref('users')
            .orderByChild('id')
            .equalTo(id)
            .once('value');

        if (!snapshot.exists()) {
            throw new Error('المستخدم غير موجود');
        }

        const userKey = Object.keys(snapshot.val())[0];
        const userData = snapshot.val()[userKey];
        if (userData.invite_role) {
            if (userData.invite_role === ROLES.MANAGER)
                throw new Error('تم إرسال دعوة لهذا المستخدم ليكون مديراً مسبقاً');
            if (userData.invite_role === ROLES.WORKER)
                throw new Error('تم إرسال دعوة لهذا المستخدم ليكون موظفاً مسبقاً');
        }
        await database()
            .ref(`users/${userKey}`)
            .update({ invite_role: role });
        return true;
    } catch (error) {
        throw error;
    }
}

export const handlePromotion = async (id, acceptBoolean, targetRole) => {
    try {
        const snapshot = await database()
            .ref('users')
            .orderByChild('id')
            .equalTo(id)
            .once('value');

        if (!snapshot.exists()) {
            throw new Error('المستخدم غير موجود');
        }

        const userKey = Object.keys(snapshot.val())[0];
        if (acceptBoolean) {
            await database()
                .ref(`users/${userKey}`)
                .update({ invite_role: null, role: targetRole });
        } else {
            await database()
                .ref(`users/${userKey}`)
                .update({ invite_role: null, role: targetRole });
        }
        return true;
    } catch (error) {
        throw error;
    }
}

export const revokeRole = async (id) => {
    try {
        const snapshot = await database()
            .ref('users')
            .orderByChild('id')
            .equalTo(id)
            .once('value');

        if (!snapshot.exists()) {
            throw new Error('المستخدم غير موجود');
        }

        const userKey = Object.keys(snapshot.val())[0];
        await database()
            .ref(`users/${userKey}`)
            .update({ invite_role: null, role: ROLES.CITIZEN });
        return true;
    } catch (error) {
        throw error;
    }
}

export const updateUser = async (user) => {
    try {
        if(!user?.id) throw new Error('لم يتم الحصول على رقم التعريف ID');

        const snapshot = await database()
            .ref('users')
            .orderByChild('id')
            .equalTo(user.id)
            .once('value');

        if (!snapshot.exists()) {
            throw new Error('المستخدم غير موجود');
        }

        await database()
            .ref(`users/${user.id}`)
            .update({
                full_name: user.full_name,
                date_of_birth: user.date_of_birth,
                area_id: user.area_id
            });
    } catch (error) {
        throw error;
    }
}