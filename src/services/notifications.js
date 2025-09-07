import { OneSignal } from 'react-native-onesignal';
import { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY } from '@env';
import { COMPLAINT_STATUS } from '../constants';
import axios from 'axios';

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
      app_id: ONESIGNAL_APP_ID,
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

    // Using axios instead of fetch
    const response = await axios.post(
      'https://api.onesignal.com/notifications',
      notificationPayload, // axios automatically stringifies JSON
      {
        headers: {
          Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
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

export const sendComplaintSttsNotification = async (userEmails, status) => {
  try {
    if (!userEmails || (Array.isArray(userEmails) && userEmails.length === 0)) {
      throw new Error('User emails are required and cannot be empty');
    }

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
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
      app_id: ONESIGNAL_APP_ID,
      // Support both single user and multiple users
      include_aliases: {
        // external_id: Array.isArray(userEmails) ? userEmails : [userEmails],
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
        timestamp: Date.now(),
      },
    };

    const response = await axios.post(
      'https://api.onesignal.com/notifications',
      notificationPayload,
      {
        headers: {
          Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
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
    // console.error('Notification error:', error);
    // throw error;
    throw new Error(`Failed to send notification: ${errorMessage}`);
  }
};

// export const sendRoleInviteNotification = async (userEmail, role) => {
//   try {
//     const roleText = {
//       en: role === 2 ? 'Manager' : 'Worker',
//       ar: role === 2 ? 'مسؤول' : 'موظف',
//     };

//     const notificationPayload = {
//       app_id: ONESIGNAL_APP_ID,
//       // Updated to use new targeting approach
//       include_aliases: {
//         external_id: [userEmail],
//       },
//       target_channel: 'push',
//       headings: {
//         en: 'دعوة دور جديد',
//         // ar: 'دعوة دور جديد',
//       },
//       contents: {
//         en: `تم دعوتك كـ ${roleText.ar}`,
//         // ar: `تم دعوتك كـ ${roleText.ar}`,
//       },
//       data: {
//         type: 'role_invite',
//         role: role,
//         roleText: roleText.en,
//         timestamp: Date.now(),
//       },
//     };

//     const response = await fetch('https://api.onesignal.com/notifications', {
//       method: 'POST',
//       headers: {
//         Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(notificationPayload),
//     });

//     const result = await response.json().catch(() => ({}));

//     if (response.ok) {
//       console.log('Notification sent successfully:', result);
//       return result;
//     } else {
//       console.error('Failed to send notification:', result);
//       throw new Error(result.errors?.[0] || 'Failed to send notification');
//     }
//   } catch (error) {
//     console.error('Notification error:', error);
//     throw error;
//   }
// };

// export const sendComplaintSttsNotification = async (userEmail, status) => {
//   try {
//     let message = null;
//     switch (status) {
//       case COMPLAINT_STATUS.ASSIGNED:
//         message = 'تم تعيين شكوى جديدة لك';
//         break;
//       case COMPLAINT_STATUS.COMPLETED:
//         message = 'تم حل الشكوى المقدمة بنجاح';
//         break;
//       case COMPLAINT_STATUS.REJECTED:
//         message = 'تم رفض الشكوى';
//         break;
//       case COMPLAINT_STATUS.RESOLVED:
//         message = 'تم حل الشكوى المقدمة بنجاح';
//         break;
//       default:
//         message = 'تم إضافة شكوى جديدة';
//     }

//     const notificationPayload = {
//       app_id: ONESIGNAL_APP_ID,
//       include_aliases: {
//         external_id: [userEmail],
//       },
//       target_channel: 'push',
//       headings: {
//         en: 'تحديث جديد بخصوص الشكواى',
//       },
//       contents: {
//         en: message,
//       },
//       data: {
//         type: 'status_update',
//         status: status,
//         message: message,
//         timestamp: Date.now(),
//       },
//     };

//     const response = await axios.post(
//       'https://api.onesignal.com/notifications',
//       notificationPayload,
//       {
//         headers: {
//           Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       },
//     );

//     console.log('Notification sent successfully:', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('Notification error:', error);
//     throw error;
//   }
// };
