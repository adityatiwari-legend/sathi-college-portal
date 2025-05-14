
'use server';
import * as admin from 'firebase-admin';

// --- Hardcoded Firebase Admin SDK Credentials ---
// !!! SECURITY WARNING: Hardcoding credentials is not recommended for production. !!!
// !!! Prefer environment variables. This is a fallback if env vars are not set. !!!
const HARDCODED_PROJECT_ID = "mysaathiapp";
const HARDCODED_CLIENT_EMAIL = "firebase-adminsdk-fbsvc@mysaathiapp.iam.gserviceaccount.com";
const HARDCODED_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCmzk/gmny7SRCg\n6wvP1CCnyaKFrfdKxu34lcjLaG+vQh+WGqWvsVufg3PVgjTmMczarphdC4xpY91p\nafhyCI4TQLi6clrtWrirgAIWko+UQ194Mc2lR2AKAfLR/+6bhuCiJxVInfv4+3pY\nA+rcxQzesBn6D7fTSnH6rx0Z9MqIWLKoUEyBHDOECq+RWbM+GQMIVmPSYssCTJaC\norzAkmhGz/IBDiOWXuJG0x+bJ2TYdv/Zyhl+eFAdB1/II9lv2GkssW/va8alXqre\nSdIMQItjis5gpQbazgQcOoC+EQW6lesPZxmq3+ILdm+pphxrAnP2yu9YS0JclRuv\nDUgjGZq1AgMBAAECggEABzM1sCaS9qJgf2wUSJgDaDxHa0XdvDW3TQKpvGf2L2AA\n2e6UBmNDzT0A4yKTH6v4h8ImDWW23Zy3KhPuKrC5izvnTWFexEryC8sQEml1agTf\ndwiogJ218X1xV2tL7hz42/iPNJRHLYSs9jKGSoAoV+gzjHKHVyCdQcdM9jm1nVCr\nxeiqBOruy+LcyIqzuGwU/gNuWY+8JnXwMUcc/UoFQ2tjAEsSjyQklgDc9yBjp/7i\nkpuylc8AIpZvYnHwktLFLs5+VcvkBC6xjE1vva/SX3b8vE3tRFa+4amHmSroQAs4\nUdjqOkJ3hHHKV9vCPY+bUHp2ZO6Ywf0SucJdwyVyUQKBgQDQ7qivThQ9Wu41yMXR\n86UDZeptaeOJEJRqAkW/Emw7SjKhdA7vbPPi3HLSG45EFUBsA3V2PI/WzlU/bfGD\nb/z3jhahbUfFxomb/WGgrV6pEvi1u4AlkHM2AM9BVFOISLmeiy3vyvs6s/nsU0m5\nvUPBdfpLuFf67OSDCrls/9vSEQKBgQDMYi6tUFaNOV0QyPRchGlBYDQe5ZdehfZS\nX2LMmp+pe7Pnt6Lzp6fFwHFPTgT5ShyvVKAMezT/emGIdNPTGaGNiintU+Y4dKJX\nYUABob6JDhmw7aA19QwhZP7taiyQOP2ug2DoP8PqDMkfp+zEgyTkbBWc/xggHx9y\nvmQks2oaZQKBgQCYwNSNju1XSmL86bRP4u2TRXEW26Mis/9+Xfj2UJbW5lGMH1lI\nDYVmKLy+Bq2F82+tSP4ZGwAjEanb/RrlePwfVkAPd+FQpO45IRC+s+KQhLFX1SVE\n0Y6aPg9JeUi1TE6BrspAFkyFx84CzYYKiWi/Se1cbQPODmKnuDCHk6z4sQKBgC1T\nYNKizG8JV7BPQJH783PCKAzqEcWuo8/kw35olBv8CQvMV+D9P2HFqdtSjBvU6cOg\nWtYpxLkbpOGkNw3L014WU/ID9zxx8Ua7lHxIKH8wl1X7fNo6e/Qz960jLLrXSLsY\n+7bF3WbcawYQMZvrEZVuuuRUVj9ZZ5oEyySwfUlZAoGBAJMH4NtM8gyGPPU5aA31\nBefDPHumkP9qrURznBWd+nxHKgi4zhmDfqH53WDgkY5CqyrUe4l6Rb4ztfF/Iy+I\naKS5bSm6/sx4Q6vin24rPr47GvgVWLyEY7noqbYvMAUCyICg0G4pQN8a8jwHRzr0\nomMg/CcZrgAp9noN0s3LmuQc\n-----END PRIVATE KEY-----`;
// --- End Hardcoded Credentials ---

function formatPrivateKey(key: string): string {
  // Preserve literal \n characters if they are double escaped in an env var,
  // or just use the string as is if it already has actual newlines (like from a template literal).
  return key.replace(/\\n/g, '\n');
}

let adminInstance: typeof admin | null = null;

function initializeFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    adminInstance = admin;
    // console.log('Firebase Admin SDK already initialized.'); // Less verbose for subsequent loads
    return;
  }

  // 1. Try GOOGLE_APPLICATION_CREDENTIALS environment variable (preferred for deployments)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      admin.initializeApp({
        // Use environment variable for storage bucket if available, otherwise construct from hardcoded project ID
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${HARDCODED_PROJECT_ID}.appspot.com`
      });
      console.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS.');
      adminInstance = admin;
      return;
    } catch (e: any) {
      console.error('Firebase Admin SDK: GOOGLE_APPLICATION_CREDENTIALS found but initialization failed (will try other methods):', e.message);
    }
  }

  // 2. Try specific Firebase environment variables
  const envProjectId = process.env.FIREBASE_PROJECT_ID;
  const envClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const envPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (envProjectId && envClientEmail && envPrivateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: envProjectId,
          clientEmail: envClientEmail,
          privateKey: formatPrivateKey(envPrivateKey),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      });
      console.log('Firebase Admin SDK initialized successfully using specific FIREBASE_... environment variables.');
      adminInstance = admin;
      return;
    } catch (e: any) {
      console.error('Firebase Admin SDK: Error initializing with specific FIREBASE_... environment variables (will try fallback):', e.message);
    }
  }

  // 3. Fallback to hardcoded credentials (with strong warning)
  // Only use if GOOGLE_APPLICATION_CREDENTIALS and specific FIREBASE_... vars were not successfully used.
  if (HARDCODED_PROJECT_ID && HARDCODED_CLIENT_EMAIL && HARDCODED_PRIVATE_KEY) {
    console.warn(
      '!!! SECURITY WARNING: Initializing Firebase Admin SDK with hardcoded credentials. ' +
      'This is NOT recommended for production. Please configure environment variables ' +
      '(GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) ' +
      'for better security.'
    );
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: HARDCODED_PROJECT_ID,
          clientEmail: HARDCODED_CLIENT_EMAIL,
          privateKey: formatPrivateKey(HARDCODED_PRIVATE_KEY), // Private key already has newlines
        }),
        storageBucket: `${HARDCODED_PROJECT_ID}.appspot.com`,
      });
      console.log('Firebase Admin SDK initialized successfully using hardcoded fallback credentials.');
      adminInstance = admin;
      return;
    } catch (e: any) {
      console.error('Firebase Admin SDK: Error initializing with hardcoded fallback credentials:', e.message);
    }
  }

  // If all methods fail
  console.error(
    'Firebase Admin SDK could not be initialized. Missing or invalid credentials from all sources ' +
    '(GOOGLE_APPLICATION_CREDENTIALS, specific environment variables, or hardcoded fallback). ' +
    'Please check your configuration.'
  );
  adminInstance = null;
}

initializeFirebaseAdminApp();

export const adminAuth = adminInstance?.auth();
export const adminDb = adminInstance?.firestore();
export const adminStorage = adminInstance?.storage();

export default adminInstance;

    