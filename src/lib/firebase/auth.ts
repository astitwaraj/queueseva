import { auth } from "./config";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

// Vendor Authentication
export const registerVendor = async (email: string, pass: string) => {
  return await createUserWithEmailAndPassword(auth, email, pass);
};

export const loginVendor = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const logoutUser = async () => {
  return await signOut(auth);
};

// Customer Authentication
export const registerCustomer = async (email: string, pass: string) => {
  return await createUserWithEmailAndPassword(auth, email, pass);
};

export const loginCustomer = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const loginCustomerAnonymously = async () => {
  return await signInAnonymously(auth);
};

export const loginCustomerWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
};
