import { OneSignal } from 'react-native-onesignal';
import { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY } from '@env';

export const setUserForNotifications = async userEmail => {
  try {
    OneSignal.login(userEmail);
    console.log('User email set for notifications:', userEmail);
  } catch (error) {
    console.error('Failed to link device for push notifications:', error);
  }
};

export const sendRoleInviteNotification = async (userEmail, role) => {
  try {
    const roleText = role === 2 ? 'مسؤول' : 'موظف';

    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [userEmail],
      channel_for_external_user_ids: 'push',
      headings: {
        ar: 'دعوة دور جديد',
      },
      contents: {
        ar: `تم دعوتك كـ ${roleText}`,
      },
      data: {
        type: 'role_invite',
        role: role,
        roleText: roleText,
        timestamp: Date.now(),
      },
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        Authorization: `key ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Notification sent successfully:', result);
      return result;
    } else {
      console.error('Failed to send notification:', result);
      throw new Error(result.errors?.[0] || 'Failed to send notification');
    }
  } catch (error) {
    console.error('Notification error:', error);
    throw error;
  }
};
