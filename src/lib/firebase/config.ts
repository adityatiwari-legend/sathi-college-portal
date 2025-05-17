
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "C6DmoepqC4qLqXGhju7LTdLr1dkbi0bf7Uc8yJcM",
  authDomain: "sathi-app-3vfky.firebaseapp.com",
  databaseURL: "https://sathi-app-3vfky-default-rtdb.firebaseio.com/",
  projectId: "sathi-app-3vfky",
  storageBucket: "sathi-app-3vfky.firebasestorage.app",
  messagingSenderId: "386973720111",
  appId: "1:386973720111:web:92c65ccd5786bb5c426541",
  measurementId: "G-JLFPG09VX2"
};

console.log("Firebase config being used by client SDK (config.ts):", JSON.stringify({...firebaseConfig, apiKey: "[REDACTED]"}, null, 2));

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let googleAuthProvider;
let analytics: Analytics | null = null;
let rtdb;

try {
  console.log("Attempting Firebase initialization in config.ts...");
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully (config.ts):", app.name);
  } else {
    app = getApp();
    console.log("Firebase app already initialized (config.ts):", app.name);
  }

  auth = getAuth(app);
  console.log("Firebase Auth initialized (config.ts):", auth ? 'Yes' : 'No');

  db = getFirestore(app);
  console.log("Firebase Firestore initialized (config.ts):", db ? 'Yes' : 'No');

  storage = getStorage(app);
  console.log("Firebase Storage initialized (config.ts):", storage ? 'Yes' : 'No');

  if (firebaseConfig.databaseURL) {
    rtdb = getDatabase(app);
    console.log("Firebase Realtime Database initialized (config.ts):", rtdb ? 'Yes' : 'No', "with URL:", firebaseConfig.databaseURL);
  } else {
    rtdb = null;
    console.log("Firebase Realtime Database URL not provided, RTDB not initialized (config.ts).");
  }

  googleAuthProvider = new GoogleAuthProvider();
  console.log("GoogleAuthProvider initialized (config.ts).");

  if (typeof window !== 'undefined') {
    console.log("Running in browser, checking Analytics support (config.ts)...");
    isSupported().then((supported) => {
      if (supported && app?.name && firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
        console.log("Firebase Analytics initialized successfully (config.ts).");
      } else if (!supported) {
        console.log("Firebase Analytics is not supported in this environment (config.ts).");
      } else if (!firebaseConfig.measurementId) {
        console.log("Firebase Analytics not initialized: measurementId is missing (config.ts).");
      }
    }).catch(error => {
      console.error("Error checking Firebase Analytics support (config.ts):", error);
    });
  } else {
    console.log("Not running in browser, skipping Analytics initialization (config.ts).");
  }
} catch (error: any) {
  console.error("CRITICAL: Firebase client SDK initialization FAILED in config.ts:", error.message, error.stack);
  // Ensure these are defined even on failure to prevent further "not defined" errors downstream
  app = app || null;
  auth = auth || null;
  db = db || null;
  storage = storage || null;
  rtdb = rtdb || null;
  googleAuthProvider = googleAuthProvider || new GoogleAuthProvider();
  analytics = null;
}

export { app, auth, db, storage, rtdb, googleAuthProvider, analytics, firebaseConfig };
