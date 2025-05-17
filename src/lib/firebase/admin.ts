
import * as admin from 'firebase-admin';

// Hardcoded fallback values - Project ID changed to sathi-app-3vfky
const HARDCODED_PROJECT_ID = "sathi-app-3vfky"; 
const HARDCODED_STORAGE_BUCKET = "sathi-app-3vfky.firebasestorage.app"; // Aligning with new project
const HARDCODED_DATABASE_URL = "https://sathi-app-3vfky-default-rtdb.firebaseio.com/"; // Updated to new project's RTDB URL

// These are from the NEW 'sathi-app-3vfky' project service account key you provided.
const HARDCODED_CLIENT_EMAIL = "firebase-adminsdk-fbsvc@mysaathiapp.iam.gserviceaccount.com"; // From your latest JSON, intended for mysaathiapp
const HARDCODED_PRIVATE_KEY_ID = "f56bfb3520997b8bc546254e6541451195995920"; // From your latest JSON
const HARDCODED_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC7RlKAcS16Z2KB\nkg/e7oS+a8y+2jgC/P7JW8Q+weehk0F0gcKvbGZ33BLI5U9c9B5hLBED51JMdS0Q\novbdRmhD1dwyZmM83kXFfyJvvrKYj0lSLac/rckYhU6raGCkE2rnaxMA+QNJf8uf\nNJ5germxYReHnoZ+ju8mbAlmi423wArFFnhFQI2fKbeE8crHbY4CwdVxSzlyIeCI\nCSrjhKyvFjEsbdfnHy69J6cHcL5OGLrPEJsjq2rdFlJtin1i9Xn4WbwR8rPSHq/g\nMlH4UM7+LfHKpRBMa5Z66tHgpO3aBZqk8TTXUdjSgaGepDgnQIiBgcwUh8/uEhmV\nNqhQYhQNAgMBAAECggEAA/3ywkQnWQWdJu/rILBq6fg4TBUwvneQItCu9TuC6YHP\nEmG1ubGQ2Zs6V0f0EiIuB5o93pxut6yDwmgG5R6cGF4VrIlcMi72w8f6/vDMs83S\nHUtV1lipAbnNvH+kF7tGOxqgNBQaytVLjOA9RAc5sBtGuiBZ85auaF5DMQlmgvUu\nnLYINhorDox3iGRjzZYFPMp92ggHAbuaW6W3iuVe6ON/jnmOxkPuEzbOZ6SyFELq\nvmMu2NSUJ/9o9sQq88/hXTYv9KWevnvRHL9SkA0WbBLnQiqo+Br8F8rlRr5LmWsp\nO7JjoBCJ/mtt7Ze7EeXKUgz3gy2PLvWOBLtqMrxNjQKBgQD4f6O9KvJhq26vDDvX\nEUvK03MJVw2vvXT67Ul8mLIB3edD5jemDRvhRGcYvDhosvrfUsb+GIQUWajNWH/A\nQ3Sl9P1MYCtihx69ianbRgGS18NJdjYjy6knX356n2B5IrI5gLdUJ4Z+w51jz1G8\nuG53f68rZ43GbZFzBytyWUpzDwKBgQDA7Y2uzOeFy96RkXax7d9GbRzV5vPdT8a3\n7e4xBTQxF3n6Sjjl1doxOY1/vBVicPhKS71iZrNX366UoEmlHvvwlU9lGKjTkIgs\n3+QIIN+MkTEOYxu0GuGM1ZtsZRRhtedTbH7nYj/jUeIpdw7sv9e1C3t7FTuTBw5O\nitlhL0IXIwKBgDKvHf98XfmL1MSBU0c3cOUKocD674CzvMNdWIrAPjZhQ0U3FIya\nyd/1aq3B3iOEteSM5qd26qGX8/UGIvBdEdKzmGJWjyLGen+gL3PY4INJ3LwED2DX\nrkWolYx/K1cpu349Aad5dFYwoc50v7AlUeqvsVPCCEm7mVoD0Vm+WpADAoGAEfgO\nMjGzfqq2WCiMPZZCLXUMMoAIRpyfjZIDlV0+tzPQkJdJJV79q4gIvdTuyPRsq77S\nLNAT9CNJR16GfXKdVJMTif75+nqDtGpF+tvU9mqvfv+MHQJD77IVf8sKUu92VDbO\nuw5TlQCTZ/lG0pYrqRkgrx4TJmaJ1pboGD0mkrECgYBh5UqceWUMI9Yg/wqBRXhq\njHIVVv/T7ZfF5nMv6+E13JKtHeqDxqGjfvEy2VU1ZsibHbdv3EeVjLjdPwDv98nr\nkOJqyB4ZOMEEZfeJ66RLN0VZvygdN2cgMN0psMz5vFmTfWiElh4vkjQMnR8RZAWB\nApqO4KgNKBQTAz+ccFqIBg==\n-----END PRIVATE KEY-----`;

function formatPrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}

let adminInstance: typeof admin | null = null;

function initializeFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    adminInstance = admin;
    console.log('Firebase Admin SDK (admin.ts): Already initialized. Project ID:', admin.apps[0]?.options.projectId);
    return;
  }
  console.log('Firebase Admin SDK (admin.ts): Attempting initialization...');

  const envProjectId = process.env.FIREBASE_PROJECT_ID;
  const envClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const envPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  let envStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET; // Using NEXT_PUBLIC_ for consistency if set
  let envDatabaseURL = process.env.FIREBASE_DATABASE_URL;

  if (envDatabaseURL && !envDatabaseURL.endsWith('/')) {
    envDatabaseURL += '/';
  }
  if (envStorageBucket && envStorageBucket.startsWith('gs://')) {
    envStorageBucket = envStorageBucket.substring(5);
  }

  const effectiveStorageBucket = envStorageBucket || HARDCODED_STORAGE_BUCKET;
  const effectiveDatabaseURL = envDatabaseURL || HARDCODED_DATABASE_URL; // This ensures new RTDB URL is used if env var isn't set

  console.log(`Firebase Admin SDK (admin.ts): Effective values - StorageBucket: ${effectiveStorageBucket}, DatabaseURL: ${effectiveDatabaseURL}`);
  
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      console.log('Firebase Admin SDK (admin.ts): Attempting initialization with GOOGLE_APPLICATION_CREDENTIALS...');
      admin.initializeApp({
        storageBucket: effectiveStorageBucket,
        databaseURL: effectiveDatabaseURL,
        projectId: envProjectId || HARDCODED_PROJECT_ID, // ADC needs projectId if not in credentials
      });
      adminInstance = admin;
      console.log('Firebase Admin SDK (admin.ts): Successfully initialized using GOOGLE_APPLICATION_CREDENTIALS. Project ID:', adminInstance.app().options.projectId);
      return;
    } catch (e: any) {
      console.warn('Firebase Admin SDK (admin.ts): GOOGLE_APPLICATION_CREDENTIALS found but initialization failed:', e.message, '. Falling back.');
    }
  } else {
    console.log('Firebase Admin SDK (admin.ts): GOOGLE_APPLICATION_CREDENTIALS environment variable not found.');
  }
  
  if (envProjectId && envClientEmail && envPrivateKey) {
    console.log('Firebase Admin SDK (admin.ts): Attempting initialization with specific FIREBASE_... environment variables...');
    const serviceAccount = {
      projectId: envProjectId,
      clientEmail: envClientEmail,
      privateKey: formatPrivateKey(envPrivateKey),
    };
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: effectiveStorageBucket,
        databaseURL: effectiveDatabaseURL,
        projectId: envProjectId,
      });
      adminInstance = admin;
      console.log('Firebase Admin SDK (admin.ts): Successfully initialized using FIREBASE_... environment variables. Project ID:', adminInstance.app().options.projectId);
      return;
    } catch (e: any) {
      console.error('Firebase Admin SDK (admin.ts): Error initializing with FIREBASE_... environment variables:', e.message, "\nConfig used: Project ID -", envProjectId, "Client Email -", envClientEmail, "Storage Bucket -", effectiveStorageBucket, "Database URL -", effectiveDatabaseURL);
    }
  } else {
     console.log('Firebase Admin SDK (admin.ts): Not all FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars are set. Trying hardcoded fallback.');
  }

  console.warn('Firebase Admin SDK (admin.ts): Attempting initialization with HARDCODED fallback credentials for sathi-app-3vfky (service account key might be for mysaathiapp, ensure it matches).');
  const serviceAccount = {
    projectId: HARDCODED_PROJECT_ID, // sathi-app-3vfky
    clientEmail: HARDCODED_CLIENT_EMAIL, // firebase-adminsdk-fbsvc@mysaathiapp.iam.gserviceaccount.com
    privateKey: formatPrivateKey(HARDCODED_PRIVATE_KEY), // The key ending in muQc
    privateKeyId: HARDCODED_PRIVATE_KEY_ID, // f56bfb...
  };
  console.log("Firebase Admin SDK (admin.ts): Hardcoded service account being used:", JSON.stringify({ ...serviceAccount, privateKey: "[REDACTED]" }));
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: HARDCODED_STORAGE_BUCKET, // sathi-app-3vfky.firebasestorage.app
      databaseURL: HARDCODED_DATABASE_URL,   // https://sathi-app-3vfky-default-rtdb.firebaseio.com/
      projectId: HARDCODED_PROJECT_ID,       // sathi-app-3vfky
    });
    adminInstance = admin;
    console.log('Firebase Admin SDK (admin.ts): Successfully initialized using HARDCODED fallback. Project ID:', adminInstance.app().options.projectId);
    return;
  } catch (e: any) {
    console.error('Firebase Admin SDK (admin.ts): Error initializing with HARDCODED fallback:', e.message, "\nHardcoded Service Account used:", JSON.stringify({...serviceAccount, privateKey: "[REDACTED]"}), "Storage Bucket -", HARDCODED_STORAGE_BUCKET, "Database URL -", HARDCODED_DATABASE_URL);
  }

  console.log('Firebase Admin SDK (admin.ts): Attempting default Application Default Credentials (ADC) initialization as last resort...');
  try {
    admin.initializeApp({
      storageBucket: effectiveStorageBucket, // Uses derived or HARDCODED_STORAGE_BUCKET
      databaseURL: effectiveDatabaseURL,   // Uses derived or HARDCODED_DATABASE_URL
      projectId: envProjectId || HARDCODED_PROJECT_ID, // Fallback to hardcoded if env not set
    });
    adminInstance = admin;
    console.log('Firebase Admin SDK (admin.ts): Successfully initialized using default ADC. Project ID:', adminInstance.app().options.projectId);
    return;
  } catch (e: any) {
    console.error('Firebase Admin SDK (admin.ts): Default ADC initialization failed:', e.message);
  }

  console.error(
    'Firebase Admin SDK (admin.ts): FAILED TO INITIALIZE. All methods failed. ' +
    'Document upload and other admin operations will not work. Please check your configuration and server logs.'
  );
  adminInstance = null;
}

initializeFirebaseAdminApp();

export const adminAuth = adminInstance?.auth();
export const adminDb = adminInstance?.firestore();
export const adminStorage = adminInstance?.storage();
export const adminRtdb = adminInstance?.database(); 

export default adminInstance;
