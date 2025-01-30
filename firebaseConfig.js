import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDWlv81LchD3i1nkAWfEuTysWrB_LQhhQ8",
  authDomain: "laundryexpress-b5fe7.firebaseapp.com",
  projectId: "laundryexpress-b5fe7",
  storageBucket: "laundryexpress-b5fe7.firebasestorage.app",
  messagingSenderId: "101324369946",
  appId: "1:101324369946:web:2b0fd9a728ee420d3e61a3",
  measurementId: "G-MT2ZEH2Z02"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
//export const auth=getAuth(app)
// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth with persistence
const auth = getAuth(app); // Use getAuth instead of initializeAuth
auth.setPersistence(getReactNativePersistence(ReactNativeAsyncStorage));
export const firestore = getFirestore(app);
export {  auth, signInWithEmailAndPassword, signInWithPhoneNumber, createUserWithEmailAndPassword, };
