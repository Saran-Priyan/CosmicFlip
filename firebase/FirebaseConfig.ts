import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBiuUYILOF3iwnr6KpGhAte13oYQ1X8veo",
  authDomain: "cosmicflip-5f3c4.firebaseapp.com",
  projectId: "cosmicflip-5f3c4",
  storageBucket: "cosmicflip-5f3c4.firebasestorage.app",
  messagingSenderId: "255614256333",
  appId: "1:255614256333:web:8b56ab87d98bb0ce759584",
  measurementId: "G-702VJW0TZR"
};

/**
 * Initializes Firebase and returns the Firestore instance.
 * @returns {Firestore} The Firestore database instance
 */
const initializeFirebase = (): Firestore => {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    } else {
      console.log('Firebase already initialized');
    }
    return firebase.firestore();
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw new Error(`Failed to initialize Firebase: ${error.message}`);
  }
};

// Export the Firestore instance with type
export const db: Firestore = initializeFirebase();

// Optional: Export firebase app for future use (e.g., auth, storage)
export { firebase };