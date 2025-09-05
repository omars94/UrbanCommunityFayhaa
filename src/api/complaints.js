import database from '@react-native-firebase/database';
import { COMPLAINT_STATUS, ROLES } from '../constants';
import { Alert } from 'react-native';

export const updateComplaintInDB = async (complaintId, updates) => {
  try {        
    console.log('Updating complaint:', complaintId, updates);
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    console.log('Update data:', updateData);

    await database()
      .ref(`complaints/${complaintId}`)
      .update(updateData);
    
    console.log('Update successful');
    return true;
  } catch (error) {
    console.error('Error updating complaint:', error);
    throw error;
  }
};

export const assignComplaint = async (complaintId, assignedUserId, assignedUserName, userRole) => {
  const updates = {
    status: COMPLAINT_STATUS.ASSIGNED,
  };

  if (userRole === ROLES.ADMIN) {
    updates.manager_assignee_id = assignedUserId;
    updates.manager_name = assignedUserName;
    updates.assigned_at = new Date().toISOString();
  } else if (userRole === ROLES.MANAGER) {
    const complaintRef = database().ref(`complaints/${complaintId}`);
    const snapshot = await complaintRef.once('value');
    const currentData = snapshot.val();
    
    const currentWorkerIds = currentData?.worker_assignee_id || [];
    const currentWorkerNames = currentData?.worker_name || [];
    const currentWorkerAssignedAt = currentData?.assigned_to_worker_at || [];
    
    if (currentWorkerIds.includes(assignedUserId)) {
      Alert.alert('هذا العامل مُعين بالفعل لهذه الشكوى');
    }
    
    updates.worker_assignee_id = [...currentWorkerIds, assignedUserId];
    updates.worker_name = [...currentWorkerNames, assignedUserName];
    updates.assigned_to_worker_at = [...currentWorkerAssignedAt, new Date().toISOString()];
  }

  return await updateComplaintInDB(complaintId, updates);
};

export const resolveComplaint = async (complaintId, photo_url, compressed_url, resolvedLat, resolvedLong) => {
  const updates = {
    status: COMPLAINT_STATUS.RESOLVED,
    resolved_at: new Date().toISOString(),
    resolved_photo_url: photo_url,
    resolved_thumbnail_url: compressed_url,
    resolved_lat: resolvedLat,
    resolved_long: resolvedLong,
  };

  return await updateComplaintInDB(complaintId, updates);
};

export const completeComplaint = async (complaintId) => {
  const updates = {
    status: COMPLAINT_STATUS.COMPLETED,
    completed_at: new Date().toISOString(),
  };

  return await updateComplaintInDB(complaintId, updates);
};

export const rejectComplaint = async (complaintId, rejectionReason) => {
  const updates = {
    status: COMPLAINT_STATUS.REJECTED,
    rejected_at: new Date().toISOString(),
    rejection_reason: rejectionReason,
  };

  return await updateComplaintInDB(complaintId, updates);
};