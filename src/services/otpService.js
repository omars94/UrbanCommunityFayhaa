import auth from '@react-native-firebase/auth';

export const requestOTP = async (phoneNumber) => {
  try {
    if (!phoneNumber.startsWith('+')) {
      throw new Error('Phone number must be in E.164 format (e.g., +96170123456)');
    }
    console.log("phone: ", phoneNumber);
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    
    return confirmation;
  } catch (error) {
    throw error;
  }
};
