
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyB73DZNfXqvoPs3EV3ExtcSz2wttJmjpUo", // Confirmed by user
  authDomain: "sathi-app-3vfky.firebaseapp.com",
  databaseURL: "https://sathi-app-3vfky-default-rtdb.firebaseio.com/", // Updated based on user input
  projectId: "sathi-app-3vfky",
  storageBucket: "sathi-app-3vfky.firebasestorage.app",
  messagingSenderId: "386973720111",
  appId: "1:386973720111:web:1efdcc3e5f732ba39bf0da",
  // measurementId: "G-JLFPG09VX2" // MeasurementId was from a previous config, removed as not in latest snippet.
};

console.log("Firebase config being used by client SDK:", JSON.stringify({...firebaseConfig, apiKey: "[REDACTED]"}, null, 2));

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let googleAuthProvider;
let analytics: Analytics | null = null;
let rtdb; // Realtime Database instance

try {
  console.log("Attempting Firebase initialization in config.ts...");
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  console.log("Firebase app instance:", app ? app.name : 'null');
  
  auth = getAuth(app);
  console.log("Firebase Auth initialized:", auth ? 'Yes' : 'No');
  
  db = getFirestore(app);
  console.log("Firebase Firestore initialized:", db ? 'Yes' : 'No');
  
  storage = getStorage(app); 
  console.log("Firebase Storage initialized:", storage ? 'Yes' : 'No');

  if (firebaseConfig.databaseURL) {
    rtdb = getDatabase(app);
    console.log("Firebase Realtime Database initialized with URL:", firebaseConfig.databaseURL, rtdb ? 'Yes' : 'No');
  } else {
    rtdb = null;
    console.log("Firebase Realtime Database URL not provided in config, RTDB not initialized.");
  }

  googleAuthProvider = new GoogleAuthProvider();
  console.log("GoogleAuthProvider initialized.");

  if (typeof window !== 'undefined') {
    console.log("Running in browser, checking Analytics support...");
    isSupported().then((supported) => {
      if (supported && app?.name && firebaseConfig.measurementId) { 
        analytics = getAnalytics(app);
        console.log("Firebase Analytics initialized successfully.");
      } else if (supported === false) {
        console.log("Firebase Analytics is not supported in this environment (isSupported() returned false).");
      } else if (!firebaseConfig.measurementId) {
        console.log("Firebase Analytics not initialized because measurementId is missing from firebaseConfig.");
      } else {
        console.log("Firebase Analytics support check: app not fully initialized or supported check failed.");
      }
    }).catch(error => {
      console.error("Error checking Firebase Analytics support:", error);
    });
  } else {
    console.log("Not running in browser, skipping Analytics initialization.");
  }
} catch (error: any) {
  console.error("CRITICAL: Firebase initialization failed in config.ts:", error.message, error.stack);
  app = app || null; 
  auth = auth || null;
  db = db || null;
  storage = storage || null;
  rtdb = rtdb || null;
  googleAuthProvider = googleAuthProvider || new GoogleAuthProvider();
  analytics = null;
}

export { app, auth, db, storage, rtdb, googleAuthProvider, analytics, firebaseConfig };
