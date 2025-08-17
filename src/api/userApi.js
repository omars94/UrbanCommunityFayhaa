import database from '@react-native-firebase/database';

export const getUserByFbUID = async (fbuid) => {
    try {
        const snapshot = await database()
            .ref('users')
            .orderByChild('firebase_uid')
            .equalTo(fbuid)
            .once('value');

        // Get the first matching user if exists
        userData = snapshot.val();

        return {
            user: userData ? Object.values(userData)[0] : null
        };
    } catch (error) {
        console.log("User fetch failed:", error);
        throw error;
    }
}