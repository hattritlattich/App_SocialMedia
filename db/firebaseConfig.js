// db/firebaseConfig.js
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, getReactNativePersistence } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getDatabase, ref, set, push, serverTimestamp } from "firebase/database"; // Sửa lại import này
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyBCnSowmt5WV632Ip_Z0ZBErWv2liLWzzY",
  databaseURL: "https://fir-socialapp-f625d-default-rtdb.asia-southeast1.firebasedatabase.app/",
  authDomain: "fir-socialapp-f625d.firebaseapp.com",
  projectId: "fir-socialapp-f625d",
  storageBucket: "fir-socialapp-f625d.appspot.com",
  messagingSenderId: "1029686841016",
  appId: "1:1029686841016:web:17bd21108b5fe0ec4fae4d",
  measurementId: "G-C7WQJE8DS8"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Use the already initialized app
}

// Initialize Firebase Auth with AsyncStorage for persistence
const auth = getAuth(app);
// Set persistence to AsyncStorage for authentication state persistence
auth.setPersistence(getReactNativePersistence(AsyncStorage))
  .then(() => {
    console.log('Persistence set to AsyncStorage');
  })
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Analytics if supported
isSupported().then((supported) => {
  if (supported) {
    const analytics = getAnalytics(app);
  } else {
    console.warn('Firebase Analytics is not supported in this environment.');
  }
});

// Initialize Firebase Realtime Database
const database = getDatabase(app); // Thay vì firebase.database()

// Export all necessary objects
export { auth, db, database, createUserWithEmailAndPassword, signInWithEmailAndPassword, ref, set, push, serverTimestamp };
