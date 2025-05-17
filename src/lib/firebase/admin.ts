
import * as admin from 'firebase-admin';

// --- Hardcoded Fallback Credentials for 'sathi-app-3vfky' ---
// These are used if environment variables are not properly set.
// IMPORTANT: For production, always prefer environment variables.
const HARDCODED_PROJECT_ID_FALLBACK_TARGET = "sathi-app-3vfky";
const HARDCODED_CLIENT_EMAIL_FALLBACK_SATHI_APP = "firebase-adminsdk-fbsvc@sathi-app-3vfky.iam.gserviceaccount.com";
const HARDCODED_PRIVATE_KEY_ID_FALLBACK_SATHI_APP = "7695914923379cac348a6441abd461444d75c644";
const HARDCODED_PRIVATE_KEY_FALLBACK_SATHI_APP = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCmEIqEr7aKOYlW\n++7/3VjStNKHxCCIs9o7I2e/YmGfDa7XUyvt795rJ7wm1ManWbJ+GtWTMSnYBJ4W\n8hwjNUMfg8xvLLdgB91PGo2bqcg5nFm/BmWjjfv2lIHqwAcPk9y4pa+/Vi1eYTQd\nZkWUB8BXFHhyazbajAzPoR+5g1wSmOEnjfgfMnlM7M+W6tJcYwzx6is5DttFdLHI\noI/R2pb0LFmVZ51JCiU9LoWlVYBDyTvPaUXWXWm2brLWNWBIpY2uncCYFZ3P/5my\n+Ro9G1IZEalYgR6FJQfz7EK5u1PsDUfGH43k2iXVyt0aknHh6kXjlbFPtKDi0qcv\npRUxRn2RAgMBAAECggEACMiRcQrztFwudti4t5UTMoLgqBs+ZoMsgnRfhqTqARi\n4e364fkI2kFV5vZkYvvgMGIWN5S3Pj8hRvyrjxOtPxSbKqqycMx9sMZKZOg+KEjs\nKMnLdLMI9437kKlzPihPmX8e/HdwCyDIT0FGbxnZWynApKml0zmq4E0JBuiLJUsV\ntMX9honSc0+2INt3HDN2L7phu+lMEJd6VTYSNQg7Mlzp8MqvGBt/TTDPGE2TPLNj\nEi9FDc6T6SVdWlsF2VpLrmsT6oOEJNIdqJ6Rjkna47/0NxLRa7VLqq4KZYtltiIe\n1pHcHNSVEJGp7oW6GcoyymjvNTIJpV6LLjxIV6q+gQKBgQDT9IeUU8xzvQcVZwhy\nN55QNqwOcrhdWYjwPCypohHOPUu5ZwqBhwuqUeAaEGvZG+JbifvgJzK3k1DCQUeu\n5MaTBlaHYa60tIOoF/03UIW7fg5C2KTlkxon8xC6CJw4uimfyt2mtQ6A6kS5+nFu\nXSR0i8lGb+oquVu5pZm3lv/ywQKBgQDIksA1PzgyeRMDMbufujstUuS3h3pbsv79\nrZ6Z4VuO1biaXlcPmyQWQ1IqZhGKHIwQUOxSlBlxyTfhaEQmU3lt+wBdeftesT8u\n6cbgC5TKW+sBBja14h7cf0cJ9HZfIKg8HYKjwTJHcH8q1qvKrcQyP2t6QOqSRQjP\ncTbZhXrO0QKBgFYJnfuE5KpaogR7FX+fuiDfgIpA4Tvre13hX1PgmQ+57AIvpKEd\nm4ugvrJ11gGEgycbZOYBo2HHZ/Hio+GHtl+6I+fCrDNoT0Utr7kDc7W/HrTd0lnq\nk6SB01lg42FXmEvoAn+IYYHNFubTlbXyEzlIAQUZqtl68pPyd+qBXhZBAoGBALKF\nzAaYypBCK6YAMhutStbAnUqtjz7nRwbL7grRBwlPOQxNQ/hkAe6+5PdP+fSQDCrJ\nnE6z+yHIE7DReTcTvVUiv+RzmkViRfafpZ/tLvYeckFrIm8pYIap0rUNnf51tsgr\nDAhtAS+M9eNPR4ESwTpoMGWUOjUOtRTOlB9wKyrBAoGBAI0oo4vQJhVK4JHPsr8W\n+nsiJ+bZtDnIx66tKSU4FDGNo4w+aqQK5TtM+cttZ4BmEoWR9XTTeRA4RB0lLqlv\n5XfJFfnrzqW9U94ivRFehheRNpYO/dlTEuzkHoW7wGJwBCzJSyM0WJygFqEdA5K6\nb+gmyL/lXyFFSu+sw8hF8SU7\n-----END PRIVATE KEY-----`;
const HARDCODED_STORAGE_BUCKET_FALLBACK_TARGET = "sathi-app-3vfky.firebasestorage.app";
const HARDCODED_DATABASE_URL_FALLBACK_TARGET = "https://sathi-app-3vfky-default-rtdb.firebaseio.com/";

function formatPrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}

let adminInstance: typeof admin | null = null;
let initializationError: Error | null = null;
let isInitializationAttempted = false;

function initializeFirebaseAdminAppInternal() {
  if (admin.apps.length > 0) {
    adminInstance = admin;
    isInitializationAttempted = true;
    console.log('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Already initialized. Project ID:', admin.apps[0]?.options.projectId);
    return;
  }
  console.log('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Attempting initialization...');
  isInitializationAttempted = true;

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

  console.log(`Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Effective initial config - ProjectId: ${effectiveProjectId}, StorageBucket: ${effectiveStorageBucket}, DatabaseURL: ${effectiveDatabaseURL}`);

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      console.log('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Attempting initialization with GOOGLE_APPLICATION_CREDENTIALS...');
      admin.initializeApp({
        storageBucket: effectiveStorageBucket,
        databaseURL: effectiveDatabaseURL,
        projectId: effectiveProjectId,
      });
      adminInstance = admin;
      console.log('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Successfully initialized using GOOGLE_APPLICATION_CREDENTIALS. Project ID:', adminInstance.app().options.projectId);
      return;
    } catch (e: any) {
      console.warn('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): GOOGLE_APPLICATION_CREDENTIALS found but initialization failed:', e.message, '. Falling back.');
    }
  }

  if (envProjectId && envClientEmail && envPrivateKey) {
    console.log('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Attempting initialization with FIREBASE_... environment variables...');
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
      console.log('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Successfully initialized using FIREBASE_... environment variables. Project ID:', adminInstance.app().options.projectId);
      return;
    } catch (e: any) {
      console.error('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Error initializing with FIREBASE_... environment variables:', e.message);
      // Store error but continue to try other methods
    }
  }

  console.log('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Attempting initialization with HARDCODED fallback credentials for project: sathi-app-3vfky');
  const hardcodedServiceAccountSathiApp = {
    projectId: HARDCODED_PROJECT_ID_FALLBACK_TARGET,
    clientEmail: HARDCODED_CLIENT_EMAIL_FALLBACK_SATHI_APP,
    privateKeyId: HARDCODED_PRIVATE_KEY_ID_FALLBACK_SATHI_APP,
    privateKey: formatPrivateKey(HARDCODED_PRIVATE_KEY_FALLBACK_SATHI_APP),
  };

  console.log(`Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Hardcoded Service Account for sathi-app-3vfky:
    Project ID: ${hardcodedServiceAccountSathiApp.projectId}
    Client Email: ${hardcodedServiceAccountSathiApp.clientEmail}
    Private Key ID: ${hardcodedServiceAccountSathiApp.privateKeyId}
  `);

  try {
    admin.initializeApp({
      credential: admin.credential.cert(hardcodedServiceAccountSathiApp),
      storageBucket: HARDCODED_STORAGE_BUCKET_FALLBACK_TARGET,
      databaseURL: HARDCODED_DATABASE_URL_FALLBACK_TARGET,
      projectId: HARDCODED_PROJECT_ID_FALLBACK_TARGET,
    });
    adminInstance = admin;
    console.log('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Successfully initialized using HARDCODED fallback for sathi-app-3vfky. Project ID:', adminInstance.app().options.projectId);
    return;
  } catch (e: any) {
    console.error('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Error initializing with HARDCODED fallback for sathi-app-3vfky:', e.message);
    initializationError = e;
  }


  console.log('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Attempting default Application Default Credentials (ADC) initialization as last resort...');
  try {
    admin.initializeApp({
      storageBucket: effectiveStorageBucket,
      databaseURL: effectiveDatabaseURL,
      projectId: effectiveProjectId,
    });
    adminInstance = admin;
    console.log('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Successfully initialized using default ADC. Project ID:', adminInstance.app().options.projectId);
    return;
  } catch (e: any) {
    console.error('Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): Default ADC initialization failed:', e.message);
    if (!initializationError) initializationError = e;
  }

  if (!adminInstance) {
    console.error(
      'Firebase Admin SDK (admin.ts initializeFirebaseAdminAppInternal): FAILED TO INITIALIZE. All methods failed. Admin operations will not work.',
      initializationError ? `Last error: ${initializationError.message}` : ''
    );
  }
}

function ensureAdminInitialized(): boolean {
  if (!isInitializationAttempted) {
    console.log('Firebase Admin SDK (ensureAdminInitialized): Initialization not yet attempted. Initializing now...');
    initializeFirebaseAdminAppInternal();
  }
  if (initializationError && !adminInstance) {
    console.error("Firebase Admin SDK (ensureAdminInitialized): Initialization previously failed:", initializationError.message);
    return false;
  }
  if (!adminInstance) {
    console.error("Firebase Admin SDK (ensureAdminInitialized): adminInstance is null even after initialization attempt(s).");
    return false;
  }
  return true;
}

// Eagerly attempt initialization when this module is loaded.
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') { // Avoid multiple initializations in test environments or during HMR
    ensureAdminInitialized();
}


export function getAdminApp() {
  if (!ensureAdminInitialized() || !adminInstance) return null;
  try {
    return adminInstance.app();
  } catch (e) {
    console.error("Firebase Admin SDK (getAdminApp): Error accessing adminInstance.app():", e);
    return null;
  }
}

export function getAdminAuth() {
  if (!ensureAdminInitialized() || !adminInstance) return null;
  try {
    return adminInstance.auth();
  } catch (e) {
    console.error("Firebase Admin SDK (getAdminAuth): Error accessing adminInstance.auth():", e);
    return null;
  }
}

export function getAdminDb() {
  if (!ensureAdminInitialized() || !adminInstance) return null;
  try {
    return adminInstance.firestore();
  } catch (e) {
    console.error("Firebase Admin SDK (getAdminDb): Error accessing adminInstance.firestore():", e);
    return null;
  }
}

export function getAdminStorage() {
  if (!ensureAdminInitialized() || !adminInstance) return null;
  try {
    return adminInstance.storage();
  } catch (e) {
    console.error("Firebase Admin SDK (getAdminStorage): Error accessing adminInstance.storage():", e);
    return null;
  }
}

export function getAdminRtdb() {
  if (!ensureAdminInitialized() || !adminInstance) return null;
  try {
    return adminInstance.database();
  } catch (e) {
    console.error("Firebase Admin SDK (getAdminRtdb): Error accessing adminInstance.database():", e);
    return null;
  }
}
