// scripts/seed-testimonials.ts
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

const TESTIMONIALS = [
  {
    associationId: 'jhusi-prayagraj',
    quote: 'The Vyapar Mandal helped resolve a critical parking bottleneck outside my textile showroom by coordinating with municipal authorities. The digital grievance tracking works flawlessly!',
    authorName: 'Ramesh Kumar',
    authorSubtitle: 'Owner, Balaji Textiles',
    createdAt: new Date().toISOString()
  },
  {
    associationId: 'jhusi-prayagraj',
    quote: 'The digital membership card was issued instantly. It makes trade coordination and official paperwork very simple. Truly a modern digital upgrade for local shops.',
    authorName: 'Vijay Sen',
    authorSubtitle: 'Owner, Vijay Groceries',
    createdAt: new Date().toISOString()
  },
  {
    associationId: 'jhusi-prayagraj',
    quote: 'Jhusi Vyapar Mandal is the backbone of our local business community. Their quick action on electricity tariff grievances saved us significant overheads.',
    authorName: 'Alok Maurya',
    authorSubtitle: 'Owner, Maurya Electronics',
    createdAt: new Date().toISOString()
  },
  {
    associationId: 'jhusi-prayagraj',
    quote: 'An exceptional platform. Registering my shop and connecting with local traders has never been this seamless. Highly recommended for every trader in Jhusi.',
    authorName: 'Priya Gupta',
    authorSubtitle: 'Manager, Gupta Cosmetics',
    createdAt: new Date().toISOString()
  }
];

async function seedTestimonials() {
  console.log('🌱 Seeding testimonials into Firestore collection...');
  try {
    const colRef = db.collection('testimonials');
    
    // Optional: Clear existing testimonials
    const snapshot = await colRef.get();
    if (!snapshot.empty) {
      console.log(`🗑️ Clearing ${snapshot.size} existing testimonials...`);
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Add new testimonials
    for (const testi of TESTIMONIALS) {
      const docRef = await colRef.add(testi);
      console.log(`✅ Added testimonial by: ${testi.authorName} (Doc ID: ${docRef.id})`);
    }

    console.log('\n🎉 SUCCESS: Seeding completed successfully!');
  } catch (err: any) {
    console.error('❌ Error seeding testimonials:', err.message || err);
    process.exit(1);
  }
}

seedTestimonials().then(() => process.exit(0));
