// scripts/create-root-user.ts
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const email = process.env.ROOT_ADMIN_EMAIL;
const password = process.env.ROOT_ADMIN_PASSWORD;
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

if (!email || !password) {
  console.error('❌ Error: ROOT_ADMIN_EMAIL and ROOT_ADMIN_PASSWORD must be defined in your .env file.');
  process.exit(1);
}

// Check for service account key
const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
let cred = admin.credential.applicationDefault();

if (fs.existsSync(serviceAccountPath)) {
  console.log('🔑 Found local serviceAccountKey.json. Initializing connection...');
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  cred = admin.credential.cert(serviceAccount);
} else {
  console.log('🌐 Local serviceAccountKey.json not found. Attempting to use application default credentials...');
}

try {
  admin.initializeApp({
    credential: cred,
    projectId: projectId || 'vyparmandal-fd61c'
  });
} catch (err: any) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', err.message);
  console.log('\n💡 Please download your service account key from Firebase Console (Project Settings > Service Accounts), save it as "serviceAccountKey.json" in the project root, and try again.');
  process.exit(1);
}

const db = admin.firestore();

async function createRootUser() {
  console.log(`🤖 Checking if Root User (${email}) already exists...`);
  
  try {
    // 1. Verify if any root user exists in Firestore
    const rootQuery = await db.collection('users').where('role', '==', 'root').limit(1).get();
    if (!rootQuery.empty) {
      const existingRoot = rootQuery.docs[0].data();
      console.log(`⚠️ Root User already exists in database: ${existingRoot.email} (UID: ${existingRoot.uid})`);
      return;
    }

    let userRecord: admin.auth.UserRecord;
    
    try {
      // 2. Try to get existing auth user
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`ℹ️ Auth account found for email: ${email}. Updating claims...`);
    } catch (authErr: any) {
      if (authErr.code === 'auth/user-not-found') {
        // Create user
        console.log(`👤 Auth account not found. Creating new user...`);
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: 'Root Administrator',
          emailVerified: true
        });
        console.log(`✅ Auth user created successfully.`);
      } else {
        throw authErr;
      }
    }

    // 3. Set Custom Claims: role = 'root'
    console.log(`🔒 Setting custom claim { role: 'root' } for UID: ${userRecord.uid}...`);
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'root' });

    // 4. Create User Profile document in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || 'Root Administrator',
      phoneNumber: userRecord.phoneNumber || '',
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=Root`,
      role: 'root',
      needsPasswordChange: true, // Force root to change password on first login
      createdAt: new Date().toISOString()
    };

    console.log(`💾 Saving Root profile to Firestore ('users/${userRecord.uid}')...`);
    await db.collection('users').doc(userRecord.uid).set(userProfile);

    // 5. Add Audit Log
    const auditLog = {
      action: 'ROOT_INITIALIZE',
      actorId: 'SYSTEM_SEED',
      actorName: 'System Script',
      details: 'Root user initialized via create-root-user.ts script',
      timestamp: new Date().toISOString()
    };
    await db.collection('auditLogs').add(auditLog);

    console.log('\n🎉 SUCCESS: Root User initialized successfully!');
    console.log(`-----------------------------------------------`);
    console.log(`Email:    ${email}`);
    console.log(`Role:     root (Enforced by Custom Claims & Firestore)`);
    console.log(`Status:   Password change required on first login.`);
    console.log(`-----------------------------------------------`);
  } catch (err: any) {
    console.error('❌ Error creating root user:', err.message || err);
    process.exit(1);
  }
}

createRootUser().then(() => process.exit(0));
