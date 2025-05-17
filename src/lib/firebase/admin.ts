
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
const HARDCODED_CLIENT_EMAIL_FALLBACK_MISMATCH = "firebase-adminsdk-fbsvc@mysaathiapp.iam.gserviceaccount.com"; // From mysaathiapp SA
const HARDCODED_PRIVATE_KEY_ID_FALLBACK_MISMATCH = "854175cf2281c04d98160c540929d97335db0535"; // From mysaathiapp SA
const HARDCODED_PRIVATE_KEY_FALLBACK_MISMATCH = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCmzk/gmny7SRCg\n6wvP1CCnyaKFrfdKxu34lcjLaG+vQh+WGqWvsVufg3PVgjTmMczarphdC4xpY91p\nafhyCI4TQLi6clrtWrirgAIWko+UQ194Mc2lR2AKAfLR/+6bhuCiJxVInfv4+3pY\nA+rcxQzesBn6D7fTSnH6rx0Z9MqIWLKoUEyBHDOECq+RWbM+GQMIVmPSYssCTJaC\norzAkmhGz/IBDiOWXuJG0x+bJ2TYdv/Zyhl+eFAdB1/II9lv2GkssW/va8alXqre\nSdIMQItjis5gpQbazgQcOoC+EQW6lesPZxmq3+ILdm+pphxrAnP2yu9YS0JclRuv\nDUgjGZq1AgMBAAECggEABzM1sCaS9qJgf2wUSJgDaDxHa0XdvDW3TQKpvGf2L2AA\n2e6UBmNDzT0A4yKTH6v4h8ImDWW23Zy3KhPuKrC5izvnTWFexEryC8sQEml1agTf\ndwiogJ218X1xV2tL7hz42/iPNJRHLYSs9jKGSoAoV+gzjHKHVyCdQcdM9jm1nVCr\nxeiqBOruy+LcyIqzuGwU/gNuWY+8JnXwMUcc/UoFQ2tjAEsSjyQklgDc9yBjp/7i\nkpuylc8AIpZvYnHwktLFLs5+VcvkBC6xjE1vva/SX3b8vE3tRFa+4amHmSroQAs4\nUdjqOkJ3hHHKV9vCPY+bUHp2ZO6Ywf0SucJdwyVyUQKBgQDQ7qivThQ9Wu41yMXR\n86UDZeptaeOJEJRqAkW/Emw7SjKhdA7vbPPi3HLSG45EFUBsA3V2PI/WzlU/bfGD\nb/z3jhahbUfFxomb/WGgrV6pEvi1u4AlkHM2AM9BVFOISLmeiy3vyvs6s/nsU0m5\nvUPBdfpLuFf67OSDCrls/9vSEQKBgQDMYi6tUFaNOV0QyPRchGlBYDQe5ZdehfZS\nX2LMmp+pe7Pnt6Lzp6fFwHFPTgT5ShyvVKAMezT/emGIdNPTGaGNiintU+Y4dKJX\nYUABob6JDhmw7aA19QwhZP7taiyQOP2ug2DoP8PqDMkfp+zEgyTkbBWc/xggHx9y\nvmQks2oaZQKBgQCYwNSNju1XSmL86bRP4u2TRXEW26Mis/9+Xfj2UJbW5lGMH1lI\nDYVmKLy+Bq2F82+tSP4ZGwAjEanb/RrlePwfVkAPd+FQpO45IRC+s+KQhLFX1SVE\n0Y6aPg9JeUi1TE6BrspAFkyFx84CzYYKiWi/Se1cbQPODmKnuDCHk6z4sQKBgC1T\nYNKizG8JV7BPQJH783PCKAzqEcWuo8/kw35olBv8CQvMV+D9P2HFqdtSjBvU6cOg\nWtYpxLkbpOGkNw3L014WU/ID9zxx8Ua7lHxIKH8wl1X7fNo6e/Qz960jLLrXSLsY\n+7bF3WbcawYQMZvrEZVuuuRUVj9ZZ5oEyySwfUlZAoGBAJMH4NtM8gyGPPU5aA31\nBefDPHumkP9qrURznBWd+nxHKgi4zhmDfqH53WDgkY5CqyrUe4l6Rb4ztfF/Iy+I\naKS5bSm6/sx4Q6vin24rPr47GvgVWLyEY7noqbYvMAUCyICg0G4pQN8a8jwHRzr0\nomMg/CcZrgAp9noN0s3LmuQc\n-----END PRIVATE KEY-----`;
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

    