
import * as admin from 'firebase-admin';

// --- Hardcoded Fallback Credentials for 'sathi-app-3vfky' ---
// IMPORTANT: For production, always prefer environment variables.
// These are used if environment variables are not properly set.
const HARDCODED_PROJECT_ID_FALLBACK_TARGET = "sathi-app-3vfky";

// These were for mysaathiapp, ensure you update these if relying on hardcode for sathi-app-3vfky
const HARDCODED_CLIENT_EMAIL_FALLBACK_SATHI_APP_3VFKY = "firebase-adminsdk-fbsvc@sathi-app-3vfky.iam.gserviceaccount.com";
const HARDCODED_PRIVATE_KEY_ID_FALLBACK_SATHI_APP_3VFKY = "7695914923379cac348a6441abd461444d75c644";
const HARDCODED_PRIVATE_KEY_FALLBACK_SATHI_APP_3VFKY = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCmEIqEr7aKOYlW\n++7/3VjStNKHxCCIs9o7I2e/YmGfDa7XUyvt795rJ7wm1ManWbJ+GtWTMSnYBJ4W\n8hwjNUMfg8xvLLdgB91PGo2bqcg5nFm/BmWjjfv2lIHqwAcPk9y4pa+/Vi1eYTQd\nZkWUB8BXFHhyazbajAzPoR+5g1wSmOEnjfgfMnlM7M+W6tJcYwzx6is5DttFdLHI\noI/R2pb0LFmVZ51JCiU9LoWlVYBDyTvPaUXWXWm2brLWNWBIpY2uncCYFZ3P/5my\n+Ro9G1IZEalYgR6FJQfz7EK5u1PsDUfGH43k2iXVyt0aknHh6kXjlbFPtKDi0qcv\npRUxRn2RAgMBAAECggEACMiRcQrztFwudti4t5UTMoLgq1Bs+ZoMsgnRfhqTqARi\n4e364fkI2kFV5vZkYvvgMGIWN5S3Pj8hRvyrjxOtPxSbKqqycMx9sMZKZOg+KEjs\nKMnLdLMI9437kKlzPihPmX8e/HdwCyDIT0FGbxnZWynApKml0zmq4E0JBuiLJUsV\ntMX9honSc0+2INt3HDN2L7phu+lMEJd6VTYSNQg7Mlzp8MqvGBt/TTDPGE2TPLNj\nEi9FDc6T6SVdWlsF2VpLrmsT6oOEJNIdqJ6Rjkna47/0NxLRa7VLqq4KZYtltiIe\n1pHcHNSVEJGp7oW6GcoyymjvNTIJpV6LLjxIV6q+gQKBgQDT9IeUU8xzvQcVZwhy\nN55QNqwOcrhdWYjwPCypohHOPUu5ZwqBhwuqUeAaEGvZG+JbifvgJzK3k1DCQUeu\n5MaTBlaHYa60tIOoF/03UIW7fg5C2KTlkxon8xC6CJw4uimfyt2mtQ6A6kS5+nFu\nXSR0i8lGb+oquVu5pZm3lv/ywQKBgQDIksA1PzgyeRMDMbufujstUuS3h3pbsv79\nrZ6Z4VuO1biaXlcPmyQWQ1IqZhGKHIwQUOxSlBlxyTfhaEQmU3lt+wBdeftesT8u\n6cbgC5TKW+sBBja14h7cf0cJ9HZfIKg8HYKjwTJHcH8q1qvKrcQyP2t6QOqSRQjP\ncTbZhXrO0QKBgFYJnfuE5KpaogR7FX+fuiDfgIpA4Tvre13hX1PgmQ+57AIvpKEd\nm4ugvrJ11gGEgycbZOYBo2HHZ/Hio+GHtl+6I+fCrDNoT0Utr7kDc7W/HrTd0lnq\nk6SB01lg42FXmEvoAn+IYYHNFubTlbXyEzlIAQUZqtl68pPyd+qBXhZBAoGBALKF\nzAaYypBCK6YAMhutStbAnUqtjz7nRwbL7grRBwlPOQxNQ/hkAe6+5PdP+fSQDCrJ\nnE6z+yHIE7DReTcTvVUiv+RzmkViRfafpZ/tLvYeckFrIm8pYIap0rUNnf51tsgr\nDAhtAS+M9eNPR4ESwTpoMGWUOjUOtRTOlB9wKyrBAoGBAI0oo4vQJhVK4JHPsr8W\n+nsiJ+bZtDnIx66tKSU4FDGNo4w+aqQK5TtM+cttZ4BmEoWR9XTTeRA4RB0lLqlv\n5XfJFfnrzqW9U94ivRFehheRNpYO/dlTEuzkHoW7wGJwBCzJSyM0WJygFqEdA5K6\nb+gmyL/lXyFFSu+sw8hF8SU7\n-----END PRIVATE KEY-----`;

const HARDCODED_STORAGE_BUCKET_FALLBACK_TARGET = "sathi-app-3vfky.firebasestorage.app";
const HARDCODED_DATABASE_URL_FALLBACK_TARGET = "https://sathi-app-3vfky-default-rtdb.firebaseio.com/";


function formatPrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}

let adminInstance: typeof admin | null = null;
let initializationError: Error | null = null;
let isInitializationAttempted = false;

function initializeFirebaseAdminAppInternal(): typeof admin | null {
  if (admin.apps.length > 0) {
    console.log('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Already initialized. Project ID:', admin.apps[0]?.options.projectId);
    return admin;
  }
  console.log('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Attempting initialization...');

  const envProjectId = process.env.FIREBASE_PROJECT_ID;
  const envClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const envPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  let envStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
  let envDatabaseURL = process.env.FIREBASE_DATABASE_URL;

  if (envDatabaseURL && !envDatabaseURL.endsWith('/')) envDatabaseURL += '/';
  if (envStorageBucket && envStorageBucket.startsWith('gs://')) envStorageBucket = envStorageBucket.substring(5);

  const effectiveProjectId = envProjectId || HARDCODED_PROJECT_ID_FALLBACK_TARGET;
  const effectiveStorageBucket = envStorageBucket || HARDCODED_STORAGE_BUCKET_FALLBACK_TARGET;
  const effectiveDatabaseURL = envDatabaseURL || HARDCODED_DATABASE_URL_FALLBACK_TARGET;

  console.log(`Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Effective target config - ProjectId: ${effectiveProjectId}, StorageBucket: ${effectiveStorageBucket}, DatabaseURL: ${effectiveDatabaseURL}`);

  // 1. Try GOOGLE_APPLICATION_CREDENTIALS environment variable (standard for GCP environments)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      console.log('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Attempting initialization with GOOGLE_APPLICATION_CREDENTIALS...');
      admin.initializeApp({
        storageBucket: effectiveStorageBucket,
        databaseURL: effectiveDatabaseURL,
        projectId: effectiveProjectId, // Explicitly pass projectId
      });
      console.log('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Successfully initialized using GOOGLE_APPLICATION_CREDENTIALS. Project ID:', admin.app().options.projectId);
      return admin;
    } catch (e: any) {
      console.warn('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): GOOGLE_APPLICATION_CREDENTIALS found but initialization failed:', e.message, '. Falling back.');
      // Do not set initializationError here, as we want to try other methods.
    }
  }

  // 2. Try individual FIREBASE_... environment variables
  if (envProjectId && envClientEmail && envPrivateKey) {
    console.log('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Attempting initialization with FIREBASE_... environment variables...');
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
        projectId: envProjectId, // Explicitly pass projectId
      });
      console.log('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Successfully initialized using FIREBASE_... environment variables. Project ID:', admin.app().options.projectId);
      return admin;
    } catch (e: any) {
      console.error('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Error initializing with FIREBASE_... environment variables:', e.message);
      if (!initializationError) initializationError = e;
    }
  } else {
    console.log('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): One or more FIREBASE_... environment variables are missing. Skipping this method.');
  }

  // 3. Fallback to hardcoded credentials (for sathi-app-3vfky)
  console.log('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Attempting initialization with HARDCODED fallback credentials for project:', HARDCODED_PROJECT_ID_FALLBACK_TARGET);
  const hardcodedServiceAccount = {
    projectId: HARDCODED_PROJECT_ID_FALLBACK_TARGET,
    clientEmail: HARDCODED_CLIENT_EMAIL_FALLBACK_SATHI_APP_3VFKY,
    privateKeyId: HARDCODED_PRIVATE_KEY_ID_FALLBACK_SATHI_APP_3VFKY,
    privateKey: formatPrivateKey(HARDCODED_PRIVATE_KEY_FALLBACK_SATHI_APP_3VFKY),
  };
  
  if (HARDCODED_PROJECT_ID_FALLBACK_TARGET === "sathi-app-3vfky" &&
      hardcodedServiceAccount.clientEmail.includes("sathi-app-3vfky") &&
      hardcodedServiceAccount.privateKeyId === "7695914923379cac348a6441abd461444d75c644" ) {
      console.log('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Using confirmed hardcoded credentials for sathi-app-3vfky.');
  } else {
      console.warn('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): WARNING - Hardcoded credentials seem to be for a different project than sathi-app-3vfky or have been changed. Check constants.');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(hardcodedServiceAccount),
      storageBucket: HARDCODED_STORAGE_BUCKET_FALLBACK_TARGET,
      databaseURL: HARDCODED_DATABASE_URL_FALLBACK_TARGET,
      projectId: HARDCODED_PROJECT_ID_FALLBACK_TARGET,
    });
    console.log('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Successfully initialized using HARDCODED fallback for sathi-app-3vfky. Project ID:', admin.app().options.projectId);
    return admin;
  } catch (e: any) {
    console.error('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Error initializing with HARDCODED fallback for sathi-app-3vfky:', e.message);
    if (!initializationError) initializationError = e;
  }

  // 4. Try Application Default Credentials (ADC) as a last resort
  console.log('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Attempting default Application Default Credentials (ADC) initialization...');
  try {
    admin.initializeApp({
      storageBucket: effectiveStorageBucket, // Use effective values here
      databaseURL: effectiveDatabaseURL,
      projectId: effectiveProjectId,
    });
    console.log('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Successfully initialized using default ADC. Project ID:', admin.app().options.projectId);
    return admin;
  } catch (e: any) {
    console.error('Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): Default ADC initialization failed:', e.message);
    if (!initializationError) initializationError = e;
  }

  console.error(
    'Firebase Admin SDK (admin-sdk.ts initializeFirebaseAdminAppInternal): FAILED TO INITIALIZE. All methods failed.',
    initializationError ? `Last error: ${initializationError.message}` : ''
  );
  return null;
}

// Initialize ONCE when the module is loaded.
adminInstance = initializeFirebaseAdminAppInternal();
isInitializationAttempted = true; // Mark that an attempt has been made

function getInitializedAdminInstance(): typeof admin | null {
  if (!isInitializationAttempted) { // Should not happen if module loading works as expected
    console.warn("Firebase Admin SDK (getInitializedAdminInstance): Module loaded but initialization flag not set. Attempting init.");
    adminInstance = initializeFirebaseAdminAppInternal();
    isInitializationAttempted = true;
  }
  if (!adminInstance && initializationError) {
     console.error("Firebase Admin SDK (getInitializedAdminInstance): Initialization previously failed:", initializationError.message);
  } else if (!adminInstance) {
     console.error("Firebase Admin SDK (getInitializedAdminInstance): Admin instance is null, initialization might have failed silently or was never successful.");
  }
  return adminInstance;
}

export function getAdminApp() {
  const instance = getInitializedAdminInstance();
  if (!instance) {
    console.error("Firebase Admin SDK (getAdminApp): Admin instance is not available.");
    return null;
  }
  try {
    return instance.app();
  } catch (e) {
    console.error("Firebase Admin SDK (getAdminApp): Error accessing instance.app():", e);
    return null;
  }
}

export function getAdminAuth() {
  const instance = getInitializedAdminInstance();
  if (!instance) {
    console.error("Firebase Admin SDK (getAdminAuth): Admin instance is not available.");
    return null;
  }
  try {
    return instance.auth();
  } catch (e) {
    console.error("Firebase Admin SDK (getAdminAuth): Error accessing instance.auth():", e);
    return null;
  }
}

export function getAdminDb() {
  const instance = getInitializedAdminInstance();
  if (!instance) {
    console.error("Firebase Admin SDK (getAdminDb): Admin instance is not available.");
    return null;
  }
  try {
    return instance.firestore();
  } catch (e) {
    console.error("Firebase Admin SDK (getAdminDb): Error accessing instance.firestore():", e);
    return null;
  }
}

export function getAdminStorage() {
  const instance = getInitializedAdminInstance();
  if (!instance) {
    console.error("Firebase Admin SDK (getAdminStorage): Admin instance is not available.");
    return null;
  }
  try {
    return instance.storage();
  } catch (e) {
    console.error("Firebase Admin SDK (getAdminStorage): Error accessing instance.storage():", e);
    return null;
  }
}

export function getAdminRtdb() {
  const instance = getInitializedAdminInstance();
  if (!instance) {
    console.error("Firebase Admin SDK (getAdminRtdb): Admin instance is not available.");
    return null;
  }
  try {
    return instance.database();
  } catch (e) {
    console.error("Firebase Admin SDK (getAdminRtdb): Error accessing instance.database():", e);
    return null;
  }
}
