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

    auth().settings.appVerificationDisabledForTesting = true;

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
