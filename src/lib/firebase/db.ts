import { db } from "./config";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

// --- Types ---
export interface Shop {
  id?: string;
  ownerId: string;
  name: string;
  category: string;
  slotDuration: number; // in minutes
  maxCapacity: number;
  avgCancellationRate: number;
}

export interface Slot {
  id?: string;
  startTime: string; // e.g., "09:00"
  date: string; // YYYY-MM-DD
  currentBookings: number;
  waitlistCount: number;
}

export interface Booking {
  id?: string;
  userId: string;
  shopId: string;
  slotId: string;
  tokenNumber: number;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
  createdAt: any; // Firestore Timestamp
  isWaitlist: boolean;
}

// --- Collections ---
const SHOPS_COL = "shops";
const BOOKINGS_COL = "bookings";

// --- Helpers ---

// Vendors (Shops)
export const createShop = async (shopData: Omit<Shop, 'id'>) => {
  const docRef = await addDoc(collection(db, SHOPS_COL), shopData);
  return docRef.id;
};

export const getShopByOwner = async (ownerId: string) => {
  const q = query(collection(db, SHOPS_COL), where("ownerId", "==", ownerId));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Shop;
  }
  return null;
};

// Slots
export const createSlot = async (shopId: string, slotData: Omit<Slot, 'id'>) => {
  const docRef = await addDoc(collection(db, `${SHOPS_COL}/${shopId}/slots`), slotData);
  return docRef.id;
};

export const getSlotsForDate = async (shopId: string, date: string) => {
  const q = query(collection(db, `${SHOPS_COL}/${shopId}/slots`), where("date", "==", date));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slot));
};

// Bookings
export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
  const data = {
    ...bookingData,
    createdAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, BOOKINGS_COL), data);
  return docRef.id;
};
