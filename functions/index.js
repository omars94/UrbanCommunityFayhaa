/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });



const functions = require('firebase-functions');
const twilio = require('twilio');
const client = new twilio(functions.config().twilio.account_sid, functions.config().twilio.auth_token);

exports.sendVerify = functions.https.onCall(async (data, context) => {
  const { phoneNumber } = data;
  try {
    const verification = await client.verify.services(functions.config().twilio.verify_service_sid)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });
    return { status: verification.status };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.checkCode = functions.https.onCall(async (data, context) => {
  const { phoneNumber, code } = data;
  try {
    const verificationCheck = await client.verify.services(functions.config().twilio.verify_service_sid)
      .verificationChecks
      .create({ to: phoneNumber, code: code });
    return { status: verificationCheck.status };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
// const twilio = require('twilio');

// admin.initializeApp();

// // Twilio configuration
// const accountSid = functions.config().twilio.account_sid;
// const authToken = functions.config().twilio.auth_token;
// const twilioPhoneNumber = functions.config().twilio.phone_number;
// const client = twilio(accountSid, authToken);

// // Generate random 6-digit code
// function generateVerificationCode() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// // Send verification code
// exports.sendVerificationCode = functions.https.onCall(async (data, context) => {
//   const { phoneNumber } = data;
  
//   if (!phoneNumber) {
//     throw new functions.https.HttpsError('invalid-argument', 'Phone number is required');
//   }

//   try {
//     // Generate verification code
//     const verificationCode = generateVerificationCode();
//     const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

//     // Store verification code in Firestore
//     await admin.firestore().collection('verificationCodes').doc(phoneNumber).set({
//       code: verificationCode,
//       expiresAt: expiresAt,
//       attempts: 0,
//       createdAt: admin.firestore.FieldValue.serverTimestamp()
//     });

//     // Send SMS via Twilio
//     await client.messages.create({
//       body: `Your verification code is: ${verificationCode}. Valid for 5 minutes.`,
//       from: twilioPhoneNumber,
//       to: phoneNumber
//     });

//     return { success: true, message: 'Verification code sent successfully' };
//   } catch (error) {
//     console.error('Error sending verification code:', error);
//     throw new functions.https.HttpsError('internal', 'Failed to send verification code');
//   }
// });

// // Verify code and create/sign in user
// exports.verifyCodeAndSignIn = functions.https.onCall(async (data, context) => {
//   const { phoneNumber, verificationCode, userData = {} } = data;

//   if (!phoneNumber || !verificationCode) {
//     throw new functions.https.HttpsError('invalid-argument', 'Phone number and verification code are required');
//   }

//   try {
//     // Get stored verification code
//     const codeDoc = await admin.firestore().collection('verificationCodes').doc(phoneNumber).get();
    
//     if (!codeDoc.exists) {
//       throw new functions.https.HttpsError('not-found', 'Verification code not found');
//     }

//     const storedData = codeDoc.data();
    
//     // Check if code has expired
//     if (Date.now() > storedData.expiresAt) {
//       await codeDoc.ref.delete();
//       throw new functions.https.HttpsError('deadline-exceeded', 'Verification code has expired');
//     }

//     // Check attempt limit
//     if (storedData.attempts >= 3) {
//       await codeDoc.ref.delete();
//       throw new functions.https.HttpsError('permission-denied', 'Too many failed attempts');
//     }

//     // Verify code
//     if (storedData.code !== verificationCode) {
//       // Increment attempts
//       await codeDoc.ref.update({ attempts: storedData.attempts + 1 });
//       throw new functions.https.HttpsError('permission-denied', 'Invalid verification code');
//     }

//     // Code is valid - create or get user
//     let userRecord;
//     try {
//       userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
//     } catch (error) {
//       if (error.code === 'auth/user-not-found') {
//         // Create new user
//         userRecord = await admin.auth().createUser({
//           phoneNumber: phoneNumber,
//           ...userData
//         });
//       } else {
//         throw error;
//       }
//     }

//     // Create custom token
//     const customToken = await admin.auth().createCustomToken(userRecord.uid);

//     // Store/update user data in Firestore
//     await admin.firestore().collection('users').doc(userRecord.uid).set({
//       uid: userRecord.uid,
//       phoneNumber: phoneNumber,
//       lastSignIn: admin.firestore.FieldValue.serverTimestamp(),
//       ...userData
//     }, { merge: true });

//     // Clean up verification code
//     await codeDoc.ref.delete();

//     return {
//       success: true,
//       customToken: customToken,
//       uid: userRecord.uid,
//       isNewUser: !userRecord.metadata.creationTime
//     };

//   } catch (error) {
//     console.error('Error verifying code:', error);
//     if (error instanceof functions.https.HttpsError) {
//       throw error;
//     }
//     throw new functions.https.HttpsError('internal', 'Failed to verify code');
//   }
// });