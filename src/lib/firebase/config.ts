
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "grxzbmBOkaUqQlgELbIDGt5fF4S23AOTCgXHKNOu", // This was updated based on your previous input
  authDomain: "mysaathiapp.firebaseapp.com",
  databaseURL: "https://mysaathiapp-default-rtdb.firebaseio.com/", // Ensure trailing slash
  projectId: "mysaathiapp",
  storageBucket: "mysaathiapp", // Updated to 'mysaathiapp'
  messagingSenderId: "986850959060",
  appId: "1:986850959060:web:92c65ccd5786bb5c426541",
  measurementId: "G-JLFPG09VX2"
};

console.log("Firebase config being used by client SDK:", JSON.stringify(firebaseConfig, (key, value) => key === 'apiKey' ? '[REDACTED]' : value, 2));

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
  
  storage = getStorage(app); // Default bucket from config will be used here
  console.log("Firebase Storage initialized:", storage ? 'Yes' : 'No');

  rtdb = getDatabase(app);
  console.log("Firebase Realtime Database initialized:", rtdb ? 'Yes' : 'No');

  googleAuthProvider = new GoogleAuthProvider();
  console.log("GoogleAuthProvider initialized.");

  if (typeof window !== 'undefined') {
    console.log("Running in browser, checking Analytics support...");
    isSupported().then((supported) => {
      if (supported && app?.name) { 
        analytics = getAnalytics(app);
        console.log("Firebase Analytics initialized successfully.");
      } else if (supported === false) {
        console.log("Firebase Analytics is not supported in this environment (isSupported() returned false).");
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
