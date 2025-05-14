
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Added GoogleAuthProvider
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics"; // Import Analytics type and isSupported

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: "grxzbmBOkaUqQlgELbIDGt5fF4S23AOTCgXHKNOu", // Updated API Key
  authDomain: "mysaathiapp.firebaseapp.com",
  projectId: "mysaathiapp",
  storageBucket: "mysaathiapp.firebasestorage.app",
  messagingSenderId: "986850959060",
  appId: "1:986850959060:web:92c65ccd5786bb5c426541",
  measurementId: "G-JLFPG09VX2"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleAuthProvider = new GoogleAuthProvider();

let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported && app.name && typeof window !== undefined) { // Check if analytics is supported
      analytics = getAnalytics(app);
    }
  });
}


export { app, auth, db, storage, googleAuthProvider, analytics, firebaseConfig };
