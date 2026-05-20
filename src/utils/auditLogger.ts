import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function logAudit(
  businessId: string,
  action: string,
  entity: string,
  entityId: string,
  branchId: string,
  userId: string,
  userName: string,
  detailsObj: any
) {
  if (!businessId) return;
  const path = `businesses/${businessId}/auditLog`;
  try {
    await addDoc(collection(db, path), {
      action,
      entity,
      entityId,
      branchId,
      performedBy: userId,
      performedByName: userName || 'Unknown',
      details: JSON.stringify(detailsObj),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
