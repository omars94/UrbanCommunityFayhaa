import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';

export const checkIfUserExist = async phoneNb => {
  try {
    const snapshot = await database()
      .ref('users')
      .orderByChild('phone_number')
      .equalTo(phoneNb)
      .once('value');

    // Get the first matching user if exists
    const userData = snapshot.val();

    return {
      inRTDB: userData ? true : false,
      profile: userData ? Object.values(userData)[0] : null,
    };
  } catch (error) {
    console.log('User check failed:', error);
    throw error;
  }
};

export const checkIfUserExistByEmail = async email => {
  try {
    const snapshot = await database()
      .ref('users')
      .orderByChild('email')
      .equalTo(email)
      .once('value');

    // Get the first matching user if exists
    const userData = snapshot.val();

    return {
      inRTDB: userData ? true : false,
      profile: userData ? Object.values(userData)[0] : null,
    };
  } catch (error) {
    console.log('User check failed:', error);
    throw error;
  }
};

export const signUpUser = async user => {
  try {
    console.log('Signing up user:', user);
    //   const passwordString = String(user.password);
    // if (passwordString.length === 0) {
    //   throw new Error('Password cannot be empty');
    // }
    
    // console.log('Password type:', typeof user.password);
    // console.log('Password value:', user.password);
    // const saltRounds = 10;
    // const salt = bcrypt.genSaltSync(saltRounds);
    // const hashedPassword = bcrypt.hashSync(user.password, salt);
    // const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    // user.password = hashedPassword;
    // RTDB uses push() to generate unique ID
    const newUserRef = database().ref('users').push();
    await newUserRef.set({
      ...user,
      password: null,
      id: newUserRef.key,
    });
    return newUserRef.key;
  } catch (error) {
    console.log('failed to save user', error);
    throw error;
  }
};

export const loginUser = async user => {
  try {
    const { email, password } = user;
    const snapshot = await database()
      .ref('users')
      .orderByChild('email')
      // .orderByChild('phone_number')
      // .equalTo(phoneNb)
      .equalTo(email)
      .once('value');

    // Get the first matching user if exists
    const userData = snapshot.val();

     if (!userData) {
      throw new Error('User not found');
    }

    const userKey = Object.keys(userData)[0];
    const userRecord = userData[userKey];

    // Compare password with hashed password using bcrypt
    // const isPasswordValid = await bcrypt.compareSync(password, userRecord.password);
    
    // if (!isPasswordValid) {
      // throw new Error('Invalid password');
    // }

    console.log('User record:', userRecord);
    // console.log('isPasswordValid:', isPasswordValid);

    // auth().settings.appVerificationDisabledForTesting = true;

    // Sign in with Firebase Auth first
    const userCredential = await auth().signInWithEmailAndPassword(
      email,
      password, 
    );
    const userT = userCredential.user;

    if (!userRecord.emailVerified && !userT.emailVerified) {
      // Sign out since email is not verified
      await auth().signOut();
      throw new Error('يجب عليك تفعيل الحساب عن طريق الرابط المرسل على بريدك الإلكتروني قبل تسجيل الدخول');
    }
    
    if (userT.emailVerified && !userRecord.emailVerified) {
      await database()
        .ref(`users/${userKey}`)
        .update({ emailVerified: true });
      userRecord.emailVerified = true;
    }

    const idToken = await userT.getIdToken();
    // console.log('Firebase ID Token:', idToken);
    
    if (userT.uid) {
      await database()
        .ref(`users/${userKey}`)
        .update({ firebase_uid: userT.uid });
    }
    
    return { 
      ...userRecord, 
      firebase_uid: userT.uid, 
      idToken,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const checkResendEligibility = async (email) => {
  try {
    const snapshot = await database()
      .ref('users')
      .orderByChild('email')
      .equalTo(email)
      .once('value');

    const userData = snapshot.val();
    
    if (!userData) {
      return {
        canResend: false,
        error: 'User not found'
      };
    }

    const userKey = Object.keys(userData)[0];
    const user = userData[userKey];
    
    const resendCount = user?.resend_count || 0;
    const lastResendTime = user?.last_resend_time || 0;
    const currentTime = Date.now();
    const oneMinuteInMs = 60 * 1000; // 1 minute in milliseconds

    // Check if max attempts reached
    if (resendCount >= 3) {
      return {
        canResend: false,
        error: 'تم الوصول إلى الحد الأقصى من المحاولات (3 مرات)',
        remainingAttempts: 0
      };
    }

    // Check cooldown period
    if (lastResendTime > 0 && (currentTime - lastResendTime) < oneMinuteInMs) {
      const remainingTime = Math.ceil((oneMinuteInMs - (currentTime - lastResendTime)) / 1000);
      return {
        canResend: false,
        error: `يرجى الانتظار ${remainingTime} ثانية قبل إعادة الإرسال`,
        remainingTime,
        remainingAttempts: 3 - resendCount
      };
    }

    return {
      canResend: true,
      remainingAttempts: 3 - resendCount,
      userKey
    };
    
  } catch (error) {
    console.log('Check resend eligibility failed:', error);
    throw error;
  }
};

// Update resend count and timestamp
export const updateResendCount = async (email) => {
  try {
    const snapshot = await database()
      .ref('users')
      .orderByChild('email')
      .equalTo(email)
      .once('value');

    const userData = snapshot.val();
    
    if (!userData) {
      throw new Error('User not found');
    }

    const userKey = Object.keys(userData)[0];
    const user = userData[userKey];
    
    const currentResendCount = user.resend_count || 0;
    const newResendCount = currentResendCount + 1;
    const currentTime = Date.now();

    // Update the user's resend count and last resend time
    await database()
      .ref(`users/${userKey}`)
      .update({
        resend_count: newResendCount,
        last_resend_time: currentTime
      });

    return {
      success: true,
      newResendCount,
      remainingAttempts: 3 - newResendCount
    };
    
  } catch (error) {
    console.log('Update resend count failed:', error);
    throw error;
  }
};

