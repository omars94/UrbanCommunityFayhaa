import database from '@react-native-firebase/database';

export const checkIfUserExist = async (phoneNb) => {
    try {
        const snapshot = await database()
            .ref('users')
            .orderByChild('phone_number')
            .equalTo(phoneNb)
            .once('value');

        // Get the first matching user if exists
        userData = snapshot.val();

        return {
            inRTDB: userData ? !!userData : false,
            profile: userData ? Object.values(userData)[0] : null
        };
    } catch (error) {
        console.log("User check failed:", error);
        throw error;
    }
}

export const signUp = async (user) => {
    try {
        // RTDB uses push() to generate unique ID
        const newUserRef = database().ref('users').push();
        await newUserRef.set({
            ...user,
            id: newUserRef.key // Include the generated ID in the data
        });
        return newUserRef.key;
    } catch (error) {
        console.log("failed to save user", error);
        throw error;
    }
}