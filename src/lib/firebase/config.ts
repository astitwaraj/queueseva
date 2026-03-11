import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDbqRQxIa5W_hJ81lWgXyA_2WFQ50PK-PY",
  authDomain: "queueseva.firebaseapp.com",
  projectId: "queueseva",
  storageBucket: "queueseva.firebasestorage.app",
  messagingSenderId: "404612843843",
  appId: "1:404612843843:web:b7a828012efc0afdfd07f6",
  measurementId: "G-HB845VFQXT"
};

// Initialize Firebase only if it hasn't been initialized yet (avoids errors in SSR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
