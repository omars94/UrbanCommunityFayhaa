import database from '@react-native-firebase/database';

export const fetchComplaints = async (dispatch, setComplaints) => {
  try {
    const snapshot = await database().ref('/complaints').once('value');
    const complaintsData = snapshot.val();
    const complaintsArray = complaintsData
      ? Object.keys(complaintsData).map(key => ({
          id: key,
          ...complaintsData[key],
        }))
      : [];
    dispatch(setComplaints(complaintsArray));
    return complaintsArray;
  } catch (error) {
    console.error('خطأ في جلب الشكاوى:', error);
    throw error;
  }
};

export const addNewComplaint = async (
  complaintData,
  dispatch,
  addComplaint,
) => {
  try {
    await database().ref('/complaints').push(complaintData);
    dispatch(addComplaint(complaintData));
    return { success: true };
  } catch (error) {
    console.error('Error submitting complaint to database:', error);
    return { success: false, error };
  }
};
