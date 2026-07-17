import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Trigger: On user creation, set default 'member' role and initialize profile
 * if not already created (to avoid overwriting pre-seeded Root/Admin accounts).
 */
export const onCreateUser = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email || '';
  const displayName = user.displayName || 'Vyapar Member';
  
  try {
    const userDocRef = db.collection('users').doc(uid);
    const docSnap = await userDocRef.get();
    
    if (docSnap.exists) {
      console.log(`👤 Profile already exists for UID: ${uid}. Skipping default initialization.`);
      return;
    }
    
    // Assign custom claims: role = 'member'
    console.log(`🔒 Setting default claim { role: 'member' } for UID: ${uid}`);
    await admin.auth().setCustomUserClaims(uid, { role: 'member' });
    
    // Create database profile
    const profile = {
      uid,
      email,
      displayName,
      phoneNumber: user.phoneNumber || '',
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      role: 'member',
      createdAt: new Date().toISOString()
    };
    
    console.log(`💾 Initializing Member profile in Firestore for UID: ${uid}`);
    await userDocRef.set(profile);
  } catch (err: any) {
    console.error(`❌ Error in onCreateUser trigger for UID: ${uid}:`, err.message || err);
  }
});

/**
 * Callable: Create a new Admin account
 * Restricted to Root User only.
 */
export const createAdmin = functions.https.onCall(async (data, context) => {
  // Validate caller permissions
  if (!context.auth || context.auth.token.role !== 'root') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Unauthorized. Only the Root Administrator can perform this action.'
    );
  }
  
  const { email, password, displayName, phoneNumber } = data;
  if (!email || !password || !displayName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: email, password, and displayName.'
    );
  }
  
  try {
    // 1. Create auth user
    const newUser = await admin.auth().createUser({
      email,
      password,
      displayName,
      phoneNumber: phoneNumber || undefined,
      emailVerified: true
    });
    
    // 2. Set Admin custom claims
    await admin.auth().setCustomUserClaims(newUser.uid, { role: 'admin' });
    
    // 3. Create profile document
    const userProfile = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName || displayName,
      phoneNumber: phoneNumber || '',
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      role: 'admin',
      needsPasswordChange: true, // Force admin to change password on first login
      createdAt: new Date().toISOString()
    };
    await db.collection('users').doc(newUser.uid).set(userProfile);
    
    // 4. Log audit log
    await db.collection('auditLogs').add({
      action: 'ADMIN_CREATE',
      actorId: context.auth.uid,
      actorName: context.auth.token.name || 'Root Administrator',
      details: `Created Admin account for ${displayName} (${email})`,
      timestamp: new Date().toISOString()
    });
    
    return { success: true, uid: newUser.uid };
  } catch (err: any) {
    console.error('❌ Error creating Admin account:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to create Admin account.');
  }
});

/**
 * Callable: Toggle Admin status (Enable/Disable)
 * Restricted to Root User only.
 */
export const toggleAdminStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'root') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Unauthorized. Only the Root Administrator can perform this action.'
    );
  }
  
  const { uid, disabled } = data;
  if (!uid || typeof disabled === 'undefined') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: uid and disabled status.'
    );
  }
  
  try {
    const adminDocRef = db.collection('users').doc(uid);
    const docSnap = await adminDocRef.get();
    
    if (!docSnap.exists || docSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError(
        'not-found',
        'Target user is not an Admin or does not exist.'
      );
    }
    
    // 1. Update auth status
    await admin.auth().updateUser(uid, { disabled });
    
    // 2. Update database profile
    await adminDocRef.update({ disabled });
    
    // 3. Log audit log
    await db.collection('auditLogs').add({
      action: disabled ? 'ADMIN_DISABLE' : 'ADMIN_ENABLE',
      actorId: context.auth.uid,
      actorName: context.auth.token.name || 'Root Administrator',
      details: `${disabled ? 'Disabled' : 'Enabled'} Admin account for ${docSnap.data()?.displayName} (${docSnap.data()?.email})`,
      timestamp: new Date().toISOString()
    });
    
    return { success: true };
  } catch (err: any) {
    console.error('❌ Error toggling Admin status:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to update Admin account status.');
  }
});

/**
 * Callable: Delete Admin account
 * Restricted to Root User only.
 */
export const deleteAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'root') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Unauthorized. Only the Root Administrator can perform this action.'
    );
  }
  
  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: uid.'
    );
  }
  
  try {
    const adminDocRef = db.collection('users').doc(uid);
    const docSnap = await adminDocRef.get();
    
    if (!docSnap.exists || docSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError(
        'not-found',
        'Target user is not an Admin or does not exist.'
      );
    }
    
    const adminName = docSnap.data()?.displayName;
    const adminEmail = docSnap.data()?.email;
    
    // 1. Delete from Auth
    await admin.auth().deleteUser(uid);
    
    // 2. Delete from database
    await adminDocRef.delete();
    
    // 3. Log audit log
    await db.collection('auditLogs').add({
      action: 'ADMIN_DELETE',
      actorId: context.auth.uid,
      actorName: context.auth.token.name || 'Root Administrator',
      details: `Deleted Admin account for ${adminName} (${adminEmail})`,
      timestamp: new Date().toISOString()
    });
    
    return { success: true };
  } catch (err: any) {
    console.error('❌ Error deleting Admin account:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to delete Admin account.');
  }
});

/**
 * Callable: Reset Admin password
 * Restricted to Root User only.
 */
export const resetAdminPassword = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'root') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Unauthorized. Only the Root Administrator can perform this action.'
    );
  }
  
  const { uid, newPassword } = data;
  if (!uid || !newPassword) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: uid and newPassword.'
    );
  }
  
  try {
    const adminDocRef = db.collection('users').doc(uid);
    const docSnap = await adminDocRef.get();
    
    if (!docSnap.exists || docSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError(
        'not-found',
        'Target user is not an Admin or does not exist.'
      );
    }
    
    // 1. Update password in Auth
    await admin.auth().updateUser(uid, { password: newPassword });
    
    // 2. Set needsPasswordChange flag in database profile
    await adminDocRef.update({ needsPasswordChange: true });
    
    // 3. Log audit log
    await db.collection('auditLogs').add({
      action: 'ADMIN_PASSWORD_RESET',
      actorId: context.auth.uid,
      actorName: context.auth.token.name || 'Root Administrator',
      details: `Reset password and set change flag for Admin ${docSnap.data()?.displayName} (${docSnap.data()?.email})`,
      timestamp: new Date().toISOString()
    });
    
    return { success: true };
  } catch (err: any) {
    console.error('❌ Error resetting Admin password:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to reset Admin password.');
  }
});
