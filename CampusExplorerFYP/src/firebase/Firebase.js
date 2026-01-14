// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBprhgt9OttLRC-ak1rTj7MSiuJ897MFVU",
  authDomain: "campusexplorer-4a01d.firebaseapp.com",
  projectId: "campusexplorer-4a01d",
  storageBucket: "campusexplorer-4a01d.firebasestorage.app",
  messagingSenderId: "802653753430",
  appId: "1:802653753430:web:1d68100215b75b5987ebf7",
  measurementId: "G-WLRTNETD04"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);