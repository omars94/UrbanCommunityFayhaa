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

// export const addNewComplaint = async (
//   complaintData,
//   dispatch,
//   addComplaint,
// ) => {
//   try {
//     const newComplaintRef = database().ref('complaints').push();

//     // await database().ref('/complaints').push(complaintData);

//     await newComplaintRef.set({
//       ...complaintData,
//       id: newComplaintRef.key,
//     });
//     dispatch(addComplaint(complaintData));
//     return { success: true, complaintId: newComplaintRef.key };
//   } catch (error) {
//     console.error('Error submitting complaint to database:', error);
//     return { success: false, error };
//   }
// };

export const addNewComplaint = async (
  complaintData,
  dispatch,
  addComplaint,
) => {
  try {
    const newComplaintRef = database().ref('complaints').push();

    // Create the complete complaint object with the generated ID
    const completeComplaintData = {
      ...complaintData,
      id: newComplaintRef.key,
    };

    await newComplaintRef.set(completeComplaintData);

    dispatch(addComplaint(completeComplaintData));

    return {
      success: true,
      complaint: completeComplaintData,
    };
  } catch (error) {
    console.error('Error submitting complaint to database:', error);
    return { success: false, error };
  }
};
