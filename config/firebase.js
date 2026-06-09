import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: "AIzaSyAV4-5rzZraH9kbPHE6BQ8Yr3_x6bG4Pes",
  authDomain: "constructioncornerindia.firebaseapp.com",
  projectId: "constructioncornerindia",
  storageBucket: "constructioncornerindia.firebasestorage.app",
  messagingSenderId: "670902518182",
  appId: "1:670902518182:web:7f49d7807557813756cf67"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);
