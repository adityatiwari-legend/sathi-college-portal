
import * as admin from 'firebase-admin';

// Fallback Hardcoded Firebase Admin SDK Credentials
// !!! SECURITY WARNING: Using hardcoded credentials is NOT recommended for production. !!!
// !!! Prefer environment variables. This is a fallback if env vars are not set. !!!
const HARDCODED_PROJECT_ID = "mysaathiapp";
const HARDCODED_CLIENT_EMAIL = "firebase-adminsdk-fbsvc@mysaathiapp.iam.gserviceaccount.com";
const HARDCODED_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCmzk/gmny7SRCg\n6wvP1CCnyaKFrfdKxu34lcjLaG+vQh+WGqWvsVufg3PVgjTmMczarphdC4xpY91p\nafhyCI4TQLi6clrtWrirgAIWko+UQ194Mc2lR2AKAfLR/+6bhuCiJxVInfv4+3pY\nA+rcxQzesBn6D7fTSnH6rx0Z9MqIWLKoUEyBHDOECq+RWbM+GQMIVmPSYssCTJaC\norzAkmhGz/IBDiOWXuJG0x+bJ2TYdv/Zyhl+eFAdB1/II9lv2GkssW/va8alXqre\nSdIMQItjis5gpQbazgQcOoC+EQW6lesPZxmq3+ILdm+pphxrAnP2yu9YS0JclRuv\nDUgjGZq1AgMBAAECggEABzM1sCaS9qJgf2wUSJgDaDxHa0XdvDW3TQKpvGf2L2AA\n2e6UBmNDzT0A4yKTH6v4h8ImDWW23Zy3KhPuKrC5izvnTWFexEryC8sQEml1agTf\ndwiogJ218X1xV2tL7hz42/iPNJRHLYSs9jKGSoAoV+gzjHKHVyCdQcdM9jm1nVCr\nxeiqBOruy+LcyIqzuGwU/gNuWY+8JnXwMUcc/UoFQ2tjAEsSjyQklgDc9yBjp/7i\nkpuylc8AIpZvYnHwktLFLs5+VcvkBC6xjE1vva/SX3b8vE3tRFa+4amHmSroQAs4\nUdjqOkJ3hHHKV9vCPY+bUHp2ZO6Ywf0SucJdwyVyUQKBgQDQ7qivThQ9Wu41yMXR\n86UDZeptaeOJEJRqAkW/Emw7SjKhdA7vbPPi3HLSG45EFUBsA3V2PI/WzlU/bfGD\nb/z3jhahbUfFxomb/WGgrV6pEvi1u4AlkHM2AM9BVFOISLmeiy3vyvs6s/nsU0m5\nvUPBdfpLuFf67OSDCrls/9vSEQKBgQDMYi6tUFaNOV0QyPRchGlBYDQe5ZdehfZS\nX2LMmp+pe7Pnt6Lzp6fFwHFPTgT5ShyvVKAMezT/emGIdNPTGaGNiintU+Y4dKJX\nYUABob6JDhmw7aA19QwhZP7taiyQOP2ug2DoP8PqDMkfp+zEgyTkbBWc/xggHx9y\nvmQks2oaZQKBgQCYwNSNju1XSmL86bRP4u2TRXEW26Mis/9+Xfj2UJbW5lGMH1lI\nDYVmKLy+Bq2F82+tSP4ZGwAjEanb/RrlePwfVkAPd+FQpO45IRC+s+KQhLFX1SVE\n0Y6aPg9JeUi1TE6BrspAFkyFx84CzYYKiWi/Se1cbQPODmKnuDCHk6z4sQKBgC1T\nYNKizG8JV7BPQJH783PCKAzqEcWuo8/kw35olBv8CQvMV+D9P2HFqdtSjBvU6cOg\nWtYpxLkbpOGkNw3L014WU/ID9zxx8Ua7lHxIKH8wl1X7fNo6e/Qz960jLLrXSLsY\n+7bF3WbcawYQMZvrEZVuuuRUVj9ZZ5oEyySwfUlZAoGBAJMH4NtM8gyGPPU5aA31\nBefDPHumkP9qrURznBWd+nxHKgi4zhmDfqH53WDgkY5CqyrUe4l6Rb4ztfF/Iy+I\naKS5bSm6/sx4Q6vin24rPr47GvgVWLyEY7noqbYvMAUCyICg0G4pQN8a8jwHRzr0\nomMg/CcZrgAp9noN0s3LmuQc\n-----END PRIVATE KEY-----`;
const HARDCODED_STORAGE_BUCKET = "mysaathiapp.firebasestorage.app"; // Corrected default format
let HARDCODED_DATABASE_URL = `https://mysaathiapp-default-rtdb.firebaseio.com/`;

if (!HARDCODED_DATABASE_URL.endsWith('/')) {
  HARDCODED_DATABASE_URL += '/';
}

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
  const envStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  let envDatabaseURL = process.env.FIREBASE_DATABASE_URL;

  const effectiveProjectId = envProjectId || HARDCODED_PROJECT_ID;
  const storageBucket = envStorageBucket || HARDCODED_STORAGE_BUCKET;
  let databaseURL = envDatabaseURL || HARDCODED_DATABASE_URL;
  
  if (databaseURL && !databaseURL.endsWith('/')) {
      databaseURL += '/';
  }
  
  console.log(`Firebase Admin SDK (admin.ts): Effective Project ID for initialization: ${effectiveProjectId}`);
  console.log(`Firebase Admin SDK (admin.ts): Storage Bucket for initialization: ${storageBucket}`);
  console.log(`Firebase Admin SDK (admin.ts): Database URL for initialization: ${databaseURL}`);

  const usedEnvVars = Boolean(envProjectId && envClientEmail && envPrivateKey);
  const usedHardcoded = !usedEnvVars && Boolean(HARDCODED_PROJECT_ID && HARDCODED_CLIENT_EMAIL && HARDCODED_PRIVATE_KEY);

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      console.log('Firebase Admin SDK (admin.ts): Attempting initialization with GOOGLE_APPLICATION_CREDENTIALS...');
      admin.initializeApp({
        storageBucket,
        databaseURL,
        projectId: effectiveProjectId, 
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
  
  let serviceAccount;
  if ((usedEnvVars || usedHardcoded) && effectiveProjectId) {
    serviceAccount = {
      projectId: effectiveProjectId,
      clientEmail: envClientEmail || HARDCODED_CLIENT_EMAIL,
      privateKey: envPrivateKey ? formatPrivateKey(envPrivateKey) : formatPrivateKey(HARDCODED_PRIVATE_KEY),
    };
    const initMethod = usedEnvVars ? "specific FIREBASE_... environment variables" : (usedHardcoded ? "hardcoded fallback credentials" : "derived/default credentials");
    console.log(`Firebase Admin SDK (admin.ts): Attempting initialization with ${initMethod}...`);
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: storageBucket,
        databaseURL: databaseURL,
        projectId: effectiveProjectId,
      });
      adminInstance = admin;
      console.log(`Firebase Admin SDK (admin.ts): Successfully initialized using ${initMethod}. Project ID:`, adminInstance.app().options.projectId);
      return;
    } catch (e: any) {
      console.error(`Firebase Admin SDK (admin.ts): Error initializing with ${initMethod}:`, e.message, "\nService Account used:", JSON.stringify({...serviceAccount, privateKey: "[REDACTED]"}));
    }
  } else {
     console.log('Firebase Admin SDK (admin.ts): Not all required credentials (projectId, clientEmail, privateKey) were available for explicit cert initialization.');
  }

  try {
    console.log('Firebase Admin SDK (admin.ts): Attempting default initialization (e.g., for App Engine, Cloud Functions)...');
    let defaultInitDatabaseURL = databaseURL;
    if (!defaultInitDatabaseURL && effectiveProjectId) { 
      defaultInitDatabaseURL = `https://${effectiveProjectId}-default-rtdb.firebaseio.com/`;
    }
     if (defaultInitDatabaseURL && !defaultInitDatabaseURL.endsWith('/')) {
        defaultInitDatabaseURL += '/';
    }
    admin.initializeApp({ 
        storageBucket, 
        databaseURL: defaultInitDatabaseURL,
        projectId: effectiveProjectId, // Make sure projectId is passed here
    });
    adminInstance = admin;
    console.log('Firebase Admin SDK (admin.ts): Successfully initialized using default credentials. Project ID:', adminInstance.app().options.projectId);
    return;
  } catch (e: any) {
    console.error('Firebase Admin SDK (admin.ts): Default initialization failed:', e.message);
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
