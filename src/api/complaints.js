import database from '@react-native-firebase/database';
import { COMPLAINT_STATUS, ROLES } from '../constants';


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

export const assignComplaint = async (complaintId, assignedUserId, assignedUserName, userRole, userId) => {
  const updates = {
    status: COMPLAINT_STATUS.ASSIGNED,
  };

  if (userRole === ROLES.ADMIN ) {
    updates.manager_assignee_id = assignedUserId;
    updates.manager_name = assignedUserName;
    updates.assigned_at = new Date().toISOString();
    updates.assigned_by = userId;
  } else if (userRole === ROLES.MANAGER) {
    updates.worker_assignee_id = assignedUserId;
    updates.worker_name = assignedUserName;
    updates.assigned_to_worker_at = new Date().toISOString();
    updates.assigned_to_worker_by = userId;
  }

  return await updateComplaintInDB(complaintId, updates);
};

export const resolveComplaint = async (complaintId, userId, photo_url) => {
  const updates = {
    status: COMPLAINT_STATUS.RESOLVED,
    resolved_at: new Date().toISOString(),
    resolved_by: userId,
    resolved_photo_url: photo_url
  };

  return await updateComplaintInDB(complaintId, updates);
};

export const completeComplaint = async (complaintId, userId) => {
  const updates = {
    status: COMPLAINT_STATUS.COMPLETED,
    completed_at: new Date().toISOString(),
    completed_by: userId,
  };

  return await updateComplaintInDB(complaintId, updates);
};

export const rejectComplaint = async (complaintId, userId, rejectionReason) => {
  const updates = {
    status: COMPLAINT_STATUS.REJECTED,
    rejected_at: new Date().toISOString(),
    rejected_by: userId,
    rejection_reason: rejectionReason,
  };

  return await updateComplaintInDB(complaintId, updates);
};