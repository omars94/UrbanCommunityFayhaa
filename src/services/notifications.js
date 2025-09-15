import { OneSignal } from 'react-native-onesignal';

import { COMPLAINT_STATUS } from '../constants';
import axios from 'axios';
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();
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
    const roleText = {
      en: role === 2 ? 'Manager' : 'Worker',
      ar: role === 2 ? 'مسؤول' : 'موظف',
    };

    const notificationPayload = {
      app_id: process.env.ONESIGNAL_APP_ID,
      // Updated to use new targeting approach
      include_aliases: {
        external_id: [userEmail],
      },
      target_channel: 'push',
      headings: {
        en: 'دعوة دور جديد',
        // ar: 'دعوة دور جديد',
      },
      contents: {
        en: `تم دعوتك كـ ${roleText.ar}`,
        // ar: `تم دعوتك كـ ${roleText.ar}`,
      },
      data: {
        type: 'role_invite',
        role: role,
        roleText: roleText.en,
        timestamp: Date.now(),
      },
    };

    const response = await axios.post(
      'https://api.onesignal.com/notifications',
      notificationPayload,
      {
        headers: {
          Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('Notification sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Notification error:', error);
    throw error;
  }
};

export const sendComplaintSttsNotification = async (
  userEmails,
  status,
  complaint,
) => {
  try {
    if (!userEmails || (Array.isArray(userEmails) && userEmails.length === 0)) {
      throw new Error('User emails are required and cannot be empty');
    }

    if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal configuration is missing');
    }
    const targetEmails = Array.isArray(userEmails) ? userEmails : [userEmails];

    let message = null;
    switch (status) {
      case COMPLAINT_STATUS.ASSIGNED:
        message = 'تم تعيين شكوى جديدة لك';
        break;
      case COMPLAINT_STATUS.COMPLETED:
        message = 'تم حل الشكوى المقدمة بنجاح';
        break;
      case COMPLAINT_STATUS.REJECTED:
        message = 'تم رفض الشكوى';
        break;
      case COMPLAINT_STATUS.RESOLVED:
        message = 'تم حل الشكوى المقدمة بنجاح';
        break;
      default:
        message = 'تم إضافة شكوى جديدة';
    }

    const notificationPayload = {
      app_id: process.env.ONESIGNAL_APP_ID,
      // Support both single user and multiple users
      include_aliases: {
        external_id: targetEmails,
      },
      target_channel: 'push',
      headings: {
        en: 'تحديث جديد بخصوص الشكواى',
      },
      contents: {
        en: message,
      },
      data: {
        type: 'status_update',
        status: status,
        message: message,
        complaint: complaint,
        timestamp: Date.now(),
      },
    };

    const response = await axios.post(
      'https://api.onesignal.com/notifications',
      notificationPayload,
      {
        headers: {
          Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log(
      'Notification sent successfully to:',
      targetEmails.length,
      'users',
    );
    console.log('OneSignal response:', response.data);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.errors?.[0] ||
      error.response?.data ||
      error.message;

    console.error('Notification error:', errorMessage);
    // console.error('No tification error:', error);
    // throw error;
    throw new Error(`Failed to send notification: ${errorMessage}`);
  }
};

// navigationIntent
let pendingNavigation = null;

export const setPendingNavigation = intent => {
  pendingNavigation = intent;
};

export const consumePendingNavigation = () => {
  if (!pendingNavigation) return null;
  const intent = pendingNavigation;
  pendingNavigation = null;
  return intent;
};
