// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "financeflow-34828.firebaseapp.com",
  projectId: "financeflow-34828",
  storageBucket: "financeflow-34828.firebasestorage.app",
  messagingSenderId: "644154931061",
  appId: "1:644154931061:web:b5c11b0864e9b07442853c",
  measurementId: "G-02JK2M2HBC",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
