// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6cLV4JpCH6QDtD0TWdvSjaiQv_i4Lhxo",
  authDomain: "bibliomanager-d452c.firebaseapp.com",
  projectId: "bibliomanager-d452c",
  storageBucket: "bibliomanager-d452c.firebasestorage.app",
  messagingSenderId: "930802451691",
  appId: "1:930802451691:web:4a9e4dcd3c2bf02115eaae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it so we can use it in other files
export const db = getFirestore(app);
