
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Added GoogleAuthProvider
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics"; // Import Analytics type and isSupported

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: "grxzbmBOkaUqQlgELbIDGt5fF4S23AOTCgXHKNOu", // User provided this key
  authDomain: "mysaathiapp.firebaseapp.com",
  projectId: "mysaathiapp",
  storageBucket: "mysaathiapp.firebasestorage.app",
  messagingSenderId: "986850959060",
  appId: "1:986850959060:web:92c65ccd5786bb5c426541",
  measurementId: "G-JLFPG09VX2"
};

console.log("Firebase config being used by client SDK:", JSON.stringify(firebaseConfig, null, 2));

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let googleAuthProvider;
let analytics: Analytics | null = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleAuthProvider = new GoogleAuthProvider();

  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported && app?.name && typeof window !== undefined) { // Check if analytics is supported and app is initialized
        analytics = getAnalytics(app);
        console.log("Firebase Analytics initialized successfully.");
      } else if (supported === false) {
        console.log("Firebase Analytics is not supported in this environment.");
      }
    }).catch(error => {
      console.error("Error checking Firebase Analytics support:", error);
    });
  }
} catch (error) {
  console.error("CRITICAL: Firebase initialization failed in config.ts:", error);
  // Fallback to null instances if initialization fails to prevent further errors down the line
  // App might not be functional but won't crash immediately on trying to use these.
  app = app || null; // Keep app if it was initialized before error
  auth = auth || null;
  db = db || null;
  storage = storage || null;
  googleAuthProvider = googleAuthProvider || new GoogleAuthProvider(); // Can still create instance
  analytics = null;
}


export { app, auth, db, storage, googleAuthProvider, analytics, firebaseConfig };
