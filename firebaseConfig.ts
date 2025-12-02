// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIgtz5-MuVWu5xjnnkkKCxKTg2OsfEXY",
  authDomain: "my-salary-app-78a41.firebaseapp.com",
  projectId: "my-salary-app-78a41",
  storageBucket: "my-salary-app-78a41.firebasestorage.app",
  messagingSenderId: "921078883023",
  appId: "1:921078883023:web:466421b79ed3c793a2cdba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services for use in the application
const firestore = getFirestore(app);
const auth = getAuth(app);

export { firestore, auth };