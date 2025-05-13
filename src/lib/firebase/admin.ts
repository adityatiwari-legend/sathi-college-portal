'use server';
import * as admin from 'firebase-admin';

interface FirebaseAdminAppParams {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function formatPrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}

function initializeFirebaseAdmin(params: FirebaseAdminAppParams) {
  if (admin.apps.length === 0) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: params.projectId,
          clientEmail: params.clientEmail,
          privateKey: formatPrivateKey(params.privateKey),
        }),
        storageBucket: `${params.projectId}.appspot.com`,
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (e: any) {
      console.error('Firebase Admin SDK initialization error:', e.stack);
    }
  }
  return admin;
}

// Attempt to initialize using specific environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

let adminInstance: typeof admin;

if (projectId && clientEmail && privateKey) {
  adminInstance = initializeFirebaseAdmin({
    projectId,
    clientEmail,
    privateKey,
  });
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // If GOOGLE_APPLICATION_CREDENTIALS is set, initializeApp() will use it.
  if (admin.apps.length === 0) {
     try {
        admin.initializeApp({
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`
        });
        console.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS.');
     } catch (e: any) {
        console.error('Firebase Admin SDK initialization error with GOOGLE_APPLICATION_CREDENTIALS:', e.stack);
     }
  }
  adminInstance = admin;
} else {
  console.warn(
    'Firebase Admin SDK not initialized. Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, or GOOGLE_APPLICATION_CREDENTIALS environment variables.'
  );
  // @ts-ignore
  adminInstance = null; // Or handle as per your app's error strategy
}


export const adminAuth = adminInstance?.auth();
export const adminDb = adminInstance?.firestore();
export const adminStorage = adminInstance?.storage();

export default adminInstance;
