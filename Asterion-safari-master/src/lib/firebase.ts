import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAw-LXmOydyF-C-8m78BWASHsPyS8RlA1k",
  authDomain: "asterion-772c8.firebaseapp.com",
  projectId: "asterion-772c8",
  storageBucket: "asterion-772c8.firebasestorage.app",
  messagingSenderId: "650122476425",
  appId: "1:650122476425:web:edb2edd868f4136cd47f58",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
