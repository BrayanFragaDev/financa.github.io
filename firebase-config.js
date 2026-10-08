// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFN7xzthbHiHftJAC9uXPBnaD_NDgMpW4",
  authDomain: "lar-em-dia-f158a.firebaseapp.com",
  projectId: "lar-em-dia-f158a",
  storageBucket: "lar-em-dia-f158a.firebasestorage.app",
  messagingSenderId: "37946368732",
  appId: "1:37946368732:web:ea2cf4ef428a01c57f0a19",
  measurementId: "G-BGGKGHNGPV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);