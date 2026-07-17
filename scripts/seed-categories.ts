// scripts/seed-categories.ts
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

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
  process.exit(1);
}

const db = admin.firestore();

const CATEGORIES = [
  { associationId: 'jhusi-prayagraj', name: 'Textiles & Garments (कपड़ा और परिधान)' },
  { associationId: 'jhusi-prayagraj', name: 'Groceries & Kirana (किराना और जनरल स्टोर)' },
  { associationId: 'jhusi-prayagraj', name: 'Electronics & Mobiles (इलेक्ट्रॉनिक्स और मोबाइल)' },
  { associationId: 'jhusi-prayagraj', name: 'Jewellery & Ornaments (आभूषण और सोना)' },
  { associationId: 'jhusi-prayagraj', name: 'Hardware & Sanitary (हार्डवेयर और सेनेटरी)' },
  { associationId: 'jhusi-prayagraj', name: 'Stationery & Books (स्टेशनरी और किताबें)' },
  { associationId: 'jhusi-prayagraj', name: 'Medical & Pharmacy (दवा और फार्मेसी)' },
  { associationId: 'jhusi-prayagraj', name: 'Footwear & Leather (जूते और चमड़ा)' },
  { associationId: 'jhusi-prayagraj', name: 'Sweet shops & Bakeries (मिठाई और बेकरी)' },
  { associationId: 'jhusi-prayagraj', name: 'Salon & Beauty Parlour (सैलून और ब्यूटी पार्लर)' },
  { associationId: 'jhusi-prayagraj', name: 'Automobiles & Spares (ऑटोमोबाइल और स्पेयर पार्ट्स)' },
  { associationId: 'jhusi-prayagraj', name: 'Dairy & Milk Parlour (डेयरी और दूध)' },
  { associationId: 'jhusi-prayagraj', name: 'Fruits & Vegetables (फल और सब्जियां)' },
  { associationId: 'jhusi-prayagraj', name: 'Other (अन्य)' }
];

async function seedCategories() {
  console.log('🌱 Seeding categories into Firestore collection...');
  try {
    const colRef = db.collection('categories');
    
    // Clear existing categories
    const snapshot = await colRef.get();
    if (!snapshot.empty) {
      console.log(`🗑️ Clearing ${snapshot.size} existing categories...`);
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Add new categories
    for (const cat of CATEGORIES) {
      const docRef = await colRef.add(cat);
      console.log(`✅ Added category: ${cat.name} (Doc ID: ${docRef.id})`);
    }

    console.log('\n🎉 SUCCESS: Seeding completed successfully!');
  } catch (err: any) {
    console.error('❌ Error seeding categories:', err.message || err);
    process.exit(1);
  }
}

seedCategories().then(() => process.exit(0));
