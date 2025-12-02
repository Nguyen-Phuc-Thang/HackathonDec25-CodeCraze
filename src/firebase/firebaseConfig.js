// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD7tGj3VUAfpr10mWfcZpugtM4hJuYq5j4",
  authDomain: "minecraft-pomodoro-92243.firebaseapp.com",
  projectId: "minecraft-pomodoro-92243",
  storageBucket: "minecraft-pomodoro-92243.firebasestorage.app",
  messagingSenderId: "303330726334",
  appId: "1:303330726334:web:96c2964b91eb989c56a9ef",
  measurementId: "G-F8T1MLW197"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);
