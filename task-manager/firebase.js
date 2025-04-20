import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-dXzedALPcdGwfWt22rJJEGasecACMDk",
  authDomain: "task-manager-6d12e.firebaseapp.com",
  projectId: "task-manager-6d12e",
  storageBucket: "task-manager-6d12e.appspot.com",
  messagingSenderId: "215237529143",
  appId: "1:215237529143:web:8e72bd4e5ed12d2ae6b9b2",
};

// Inițializează aplicația Firebase
const app = initializeApp(firebaseConfig);

// Inițializează serviciile Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
