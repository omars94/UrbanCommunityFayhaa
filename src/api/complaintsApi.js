import database from '@react-native-firebase/database';

export const fetchComplaints = async (dispatch) => {
    try {
        const snapshot = await database().ref('/complaints').once('value');
        const complaintsData = snapshot.val();
        const complaintsArray = complaintsData
            ? Object.keys(complaintsData).map(key => ({
                id: key,
                ...complaintsData[key],
            }))
            : [];
        return complaintsArray;
    } catch (error) {
        console.error('خطأ في جلب الشكاوى:', error);
        throw error;
    }
};