// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAGIUjPcGj1MNyC1aBMezDl844Vv66a0W8",
  authDomain: "minecraft-pomodoro.firebaseapp.com",
  projectId: "minecraft-pomodoro",
  storageBucket: "minecraft-pomodoro.firebasestorage.app",
  messagingSenderId: "403869075824",
  appId: "1:403869075824:web:03b4fca5fd65bce2cf67b5",
  measurementId: "G-B2HPTNGXQW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);