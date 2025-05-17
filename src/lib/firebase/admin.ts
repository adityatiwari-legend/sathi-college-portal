
import * as admin from 'firebase-admin';

// Constants for sathi-app-3vfky project (as per user's latest project target)
const TARGET_PROJECT_ID = "sathi-app-3vfky";
const TARGET_STORAGE_BUCKET = "sathi-app-3vfky.firebasestorage.app"; // Default or from NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
const TARGET_DATABASE_URL = "https://sathi-app-3vfky-default-rtdb.firebaseio.com/";

// Fallback credentials - THESE ARE CURRENTLY MISMATCHED if used for sathi-app-3vfky
// The client_email and private_key below are from a service account for 'mysaathiapp'
// (private_key_id: "854175cf2281c04d98160c540929d97335db0535")
// If environment variables are not set, this fallback will likely FAIL for 'sathi-app-3vfky'.
const HARDCODED_PROJECT_ID_FALLBACK_TARGET = TARGET_PROJECT_ID; // This is correct for target project
const HARDCODED_CLIENT_EMAIL_FALLBACK_MISMATCH = "firebase-adminsdk-fbsvc@sathi-app-3vfky.iam.gserviceaccount.com"; // From mysaathiapp SA
const HARDCODED_PRIVATE_KEY_ID_FALLBACK_MISMATCH = "7695914923379cac348a6441abd461444d75c644"; // From mysaathiapp SA
const HARDCODED_PRIVATE_KEY_FALLBACK_MISMATCH = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCmEIqEr7aKOYlW\n++7/3VjStNKHxCCIs9o7I2e/YmGfDa7XUyvt795rJ7wm1ManWbJ+GtWTMSnYBJ4W\n8hwjNUMfg8xvLLdgB91PGo2bqcg5nFm/BmWjjfv2lIHqwAcPk9y4pa+/Vi1eYTQd\nZkWUB8BXFHhyazbajAzPoR+5g1wSmOEnjfgfMnlM7M+W6tJcYwzx6is5DttFdLHI\noI/R2pb0LFmVZ51JCiU9LoWlVYBDyTvPaUXWXWm2brLWNWBIpY2uncCYFZ3P/5my\n+Ro9G1IZEalYgR6FJQfz7EK5u1PsDUfGH43k2iXVyt0aknHh6kXjlbFPtKDi0qcv\npRUxRn2RAgMBAAECggEACMiRcQrztFwudti4t5UTMoLgq1Bs+ZoMsgnRfhqTqARi\n4e364fkI2kFV5vZkYvvgMGIWN5S3Pj8hRvyrjxOtPxSbKqqycMx9sMZKZOg+KEjs\nKMnLdLMI9437kKlzPihPmX8e/HdwCyDIT0FGbxnZWynApKml0zmq4E0JBuiLJUsV\ntMX9honSc0+2INt3HDN2L7phu+lMEJd6VTYSNQg7Mlzp8MqvGBt/TTDPGE2TPLNj\nEi9FDc6T6SVdWlsF2VpLrmsT6oOEJNIdqJ6Rjkna47/0NxLRa7VLqq4KZYtltiIe\n1pHcHNSVEJGp7oW6GcoyymjvNTIJpV6LLjxIV6q+gQKBgQDT9IeUU8xzvQcVZwhy\nN55QNqwOcrhdWYjwPCypohHOPUu5ZwqBhwuqUeAaEGvZG+JbifvgJzK3k1DCQUeu\n5MaTBlaHYa60tIOoF/03UIW7fg5C2KTlkxon8xC6CJw4uimfyt2mtQ6A6kS5+nFu\nXSR0i8lGb+oquVu5pZm3lv/ywQKBgQDIksA1PzgyeRMDMbufujstUuS3h3pbsv79\nrZ6Z4VuO1biaXlcPmyQWQ1IqZhGKHIwQUOxSlBlxyTfhaEQmU3lt+wBdeftesT8u\n6cbgC5TKW+sBBja14h7cf0cJ9HZfIKg8HYKjwTJHcH8q1qvKrcQyP2t6QOqSRQjP\ncTbZhXrO0QKBgFYJnfuE5KpaogR7FX+fuiDfgIpA4Tvre13hX1PgmQ+57AIvpKEd\nm4ugvrJ11gGEgycbZOYBo2HHZ/Hio+GHtl+6I+fCrDNoT0Utr7kDc7W/HrTd0lnq\nk6SB01lg42FXmEvoAn+IYYHNFubTlbXyEzlIAQUZqtl68pPyd+qBXhZBAoGBALKF\nzAaYypBCK6YAMhutStbAnUqtjz7nRwbL7grRBwlPOQxNQ/hkAe6+5PdP+fSQDCrJ\nnE6z+yHIE7DReTcTvVUiv+RzmkViRfafpZ/tLvYeckFrIm8pYIap0rUNnf51tsgr\nDAhtAS+M9eNPR4ESwTpoMGWUOjUOtRTOlB9wKyrBAoGBAI0oo4vQJhVK4JHPsr8W\n+nsiJ+bZtDnIx66tKSU4FDGNo4w+aqQK5TtM+cttZ4BmEoWR9XTTeRA4RB0lLqlv\n5XfJFfnrzqW9U94ivRFehheRNpYO/dlTEuzkHoW7wGJwBCzJSyM0WJygFqEdA5K6\nb+gmyL/lXyFFSu+sw8hF8SU7\n-----END PRIVATE KEY-----`;
const HARDCODED_STORAGE_BUCKET_FALLBACK = TARGET_STORAGE_BUCKET;
const HARDCODED_DATABASE_URL_FALLBACK = TARGET_DATABASE_URL;


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
  let envStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET; // Check both
  let envDatabaseURL = process.env.FIREBASE_DATABASE_URL;

  if (envDatabaseURL && !envDatabaseURL.endsWith('/')) {
    envDatabaseURL += '/';
  }
  if (envStorageBucket && envStorageBucket.startsWith('gs://')) {
    envStorageBucket = envStorageBucket.substring(5);
  }
  
  const effectiveProjectId = envProjectId || HARDCODED_PROJECT_ID_FALLBACK_TARGET;
  const effectiveStorageBucket = envStorageBucket || HARDCODED_STORAGE_BUCKET_FALLBACK;
  const effectiveDatabaseURL = envDatabaseURL || HARDCODED_DATABASE_URL_FALLBACK;

  console.log(`Firebase Admin SDK (admin.ts): Effective config values - ProjectId: ${effectiveProjectId}, StorageBucket: ${effectiveStorageBucket}, DatabaseURL: ${effectiveDatabaseURL}`);

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      console.log('Firebase Admin SDK (admin.ts): Attempting initialization with GOOGLE_APPLICATION_CREDENTIALS...');
      admin.initializeApp({
        storageBucket: effectiveStorageBucket, // Use effective value
        databaseURL: effectiveDatabaseURL,   // Use effective value
        projectId: effectiveProjectId,       // Use effective value
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
    console.log('Firebase Admin SDK (admin.ts): Attempting initialization with FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY environment variables...');
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
        projectId: envProjectId, // Explicitly pass project ID
      });
      adminInstance = admin;
      console.log('Firebase Admin SDK (admin.ts): Successfully initialized using FIREBASE_... environment variables. Project ID:', adminInstance.app().options.projectId);
      return;
    } catch (e: any) {
      console.error('Firebase Admin SDK (admin.ts): Error initializing with FIREBASE_... environment variables:', e.message, "\nConfig used: Project ID -", envProjectId, "Client Email -", envClientEmail, "Storage Bucket -", effectiveStorageBucket, "Database URL -", effectiveDatabaseURL);
    }
  } else {
     console.log('Firebase Admin SDK (admin.ts): Not all required FIREBASE_... environment variables are set (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY). Trying hardcoded fallback.');
  }

  console.warn('Firebase Admin SDK (admin.ts): Attempting initialization with HARDCODED fallback credentials.');
  console.warn(`Firebase Admin SDK (admin.ts): HARDCODED_PROJECT_ID_FALLBACK_TARGET: ${HARDCODED_PROJECT_ID_FALLBACK_TARGET}`);
  console.warn(`Firebase Admin SDK (admin.ts): HARDCODED_CLIENT_EMAIL_FALLBACK_MISMATCH: ${HARDCODED_CLIENT_EMAIL_FALLBACK_MISMATCH} (This email MUST belong to project ${HARDCODED_PROJECT_ID_FALLBACK_TARGET})`);
  console.warn(`Firebase Admin SDK (admin.ts): HARDCODED_PRIVATE_KEY_ID_FALLBACK_MISMATCH: ${HARDCODED_PRIVATE_KEY_ID_FALLBACK_MISMATCH} (This key ID MUST belong to project ${HARDCODED_PROJECT_ID_FALLBACK_TARGET})`);
  
  if (HARDCODED_PROJECT_ID_FALLBACK_TARGET !== "sathi-app-3vfky" || 
      !HARDCODED_CLIENT_EMAIL_FALLBACK_MISMATCH.includes("sathi-app-3vfky") ||
      !HARDCODED_PRIVATE_KEY_ID_FALLBACK_MISMATCH) { // Add check for key ID if you have one for sathi-app-3vfky
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.error("Firebase Admin SDK (admin.ts): CRITICAL MISMATCH in hardcoded fallback credentials!");
      console.error(`Intended Project ID: ${TARGET_PROJECT_ID}`);
      console.error(`Hardcoded Client Email is for a different project: ${HARDCODED_CLIENT_EMAIL_FALLBACK_MISMATCH}`);
      console.error("This WILL cause authentication failures if this fallback is used.");
      console.error("Please ensure FIREBASE_... environment variables are correctly set for 'sathi-app-3vfky',");
      console.error("OR provide the correct service account client_email and private_key for 'sathi-app-3vfky' to be hardcoded.");
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  }

  const serviceAccount = {
    projectId: HARDCODED_PROJECT_ID_FALLBACK_TARGET,
    clientEmail: HARDCODED_CLIENT_EMAIL_FALLBACK_MISMATCH,
    privateKeyId: HARDCODED_PRIVATE_KEY_ID_FALLBACK_MISMATCH, 
    privateKey: formatPrivateKey(HARDCODED_PRIVATE_KEY_FALLBACK_MISMATCH),
  };
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: HARDCODED_STORAGE_BUCKET_FALLBACK,
      databaseURL: HARDCODED_DATABASE_URL_FALLBACK,
      projectId: HARDCODED_PROJECT_ID_FALLBACK_TARGET, // Explicitly pass project ID
    });
    adminInstance = admin;
    console.log('Firebase Admin SDK (admin.ts): Successfully initialized using HARDCODED fallback. Project ID:', adminInstance.app().options.projectId);
    if (adminInstance.app().options.projectId !== HARDCODED_CLIENT_EMAIL_FALLBACK_MISMATCH.split('@')[1].split('.')[0] && HARDCODED_CLIENT_EMAIL_FALLBACK_MISMATCH !== "your-client-email-for-sathi-app-3vfky@sathi-app-3vfky.iam.gserviceaccount.com" ) {
        console.warn("Firebase Admin SDK (admin.ts): WARNING - Hardcoded fallback client_email might not match the hardcoded project_id. This can lead to issues.");
    }
    return;
  } catch (e: any) {
    console.error('Firebase Admin SDK (admin.ts): Error initializing with HARDCODED fallback:', e.message, "\nHardcoded Service Account used:", JSON.stringify({...serviceAccount, privateKey: "[REDACTED]"}), "Storage Bucket -", HARDCODED_STORAGE_BUCKET_FALLBACK, "Database URL -", HARDCODED_DATABASE_URL_FALLBACK);
  }

  console.log('Firebase Admin SDK (admin.ts): Attempting default Application Default Credentials (ADC) initialization as last resort...');
  try {
    admin.initializeApp({
      storageBucket: effectiveStorageBucket, // Use effective value from env or target
      databaseURL: effectiveDatabaseURL,   // Use effective value from env or target
      projectId: effectiveProjectId,       // Use effective value from env or target
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
  adminInstance = null; // Ensure adminInstance is explicitly null if all init fails
}

initializeFirebaseAdminApp();

export const adminAuth = adminInstance?.auth();
export const adminDb = adminInstance?.firestore();
export const adminStorage = adminInstance?.storage();
export const adminRtdb = adminInstance?.database(); 

export default adminInstance;

    