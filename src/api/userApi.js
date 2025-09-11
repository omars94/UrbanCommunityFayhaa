import database from '@react-native-firebase/database';
import { ROLES } from '../constants';
import { sendRoleInviteNotification } from '../services/notifications';

export const getUserByFbUID = async fbuid => {
  try {
    const snapshot = await database()
      .ref('users')
      .orderByChild('firebase_uid')
      .equalTo(fbuid)
      .once('value');

    // Get the first matching user if exists
    const userData = snapshot.val();

    return userData ? Object.values(userData)[0] : null;
  } catch (error) {
    console.log('User fetch failed:', error);
    throw error;
  }
};

export const getAllByRole = async role => {
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
};

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
    await database().ref(`users/${userKey}`).update({ invite_role: role });
    if (userData.email) {
      try {
        await sendRoleInviteNotification(userData.email, role);
        console.log('user invited and notification sent');
      } catch (notifError) {
        console.warn('user invited but notification failed:', notifError);
      }
    } else {
      console.warn('User has no email, notification not sent');
    }
    return true;
  } catch (error) {
    throw error;
  }
};

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
};

export const revokeRole = async id => {
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
};

export const updateUser = async user => {
  try {
    if (!user?.id) throw new Error('لم يتم الحصول على رقم التعريف ID');

    const snapshot = await database()
      .ref('users')
      .orderByChild('id')
      .equalTo(user.id)
      .once('value');

    if (!snapshot.exists()) {
      throw new Error('المستخدم غير موجود');
    }

    await database().ref(`users/${user.id}`).update({
      full_name: user.full_name,
      date_of_birth: user.date_of_birth,
      area_id: user.area_id,
    });
  } catch (error) {
    throw error;
  }
};

export const listenUsersByRole = (role, callback) => {
  const reference = database().ref('/users').orderByChild('role').equalTo(role);

  const onValueChange = reference.on('value', snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const userList = Object.keys(data).map(key => ({
        id: key,
        ...data[key],
      }));
      callback(userList);
    } else {
      callback([]);
    }
  });

  // Return unsubscribe function
  return () => reference.off('value', onValueChange);
};

export const getAdminEmails = async () => {
  try {
    const snapshot = await database()
      .ref('users')
      .orderByChild('role')
      .equalTo(1)
      .once('value');

    const usersData = snapshot.val();

    if (!usersData) {
      return [];
    }

    const emails = Object.values(usersData).map(user => user.email || '');
    // // Extract id and email
    // const result = Object.entries(usersData).map(([key, user]) => ({
    //   id: user.id || key,
    //   email: user.email || '',
    return emails;
  } catch (error) {
    console.log('Fetching users with role=1 failed:', error);
    throw error;
  }
};

export const getEmailbyId = async (ids) => {
  try {
    // Handle both single ID and array of IDs
    const idsArray = Array.isArray(ids) ? ids : [ids];
    const isInvalidInput = idsArray.length === 0 || idsArray.some(id => !id);
    
    if (isInvalidInput) {
      throw new Error('معرف المستخدم مطلوب');
    }

    const emailPromises = idsArray.map(async (id) => {
      try {
        const snapshot = await database()
          .ref('users')
          .orderByChild('id')
          .equalTo(id)
          .once('value');
        
        if (!snapshot.exists()) {
          return { id, email: null, error: 'المستخدم غير موجود' };
        }
        
        const userKey = Object.keys(snapshot.val())[0];
        const userData = snapshot.val()[userKey];
        return { id, email: userData.email || null };
      } catch (error) {
        return { id, email: null, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    
    // If single ID was passed, return single result
    if (!Array.isArray(ids)) {
      const result = results[0];
      if (result.error) {
        throw new Error(result.error);
      }
      return result.email;
    }
    
    // For arrays, return array of emails (excluding failed ones)
    return results
      .filter(result => result.email !== null && !result.error)
      .map(result => result.email);
    
  } catch (error) {
    console.log('Fetching emails failed:', error);
    throw error;
  }
};

