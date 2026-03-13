import { db } from "./config";
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc
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
  createdAt: Timestamp; // Firestore Timestamp
  isWaitlist: boolean;
  waitlistNumber?: number; // 0 for confirmed, 1+ for waitlist
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  showContactToVendor?: boolean;
}

export interface UserProfile {
  id: string; // matches auth UID
  displayName: string;
  email: string;
  phoneNumber: string;
  showContactToVendor: boolean;
  updatedAt?: Timestamp;
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

export const cancelBooking = async (bookingId: string, shopId: string, slotId: string, isWaitlist: boolean) => {
  const { doc, deleteDoc, updateDoc, increment } = await import('firebase/firestore');
  
  // Delete the booking doc
  await deleteDoc(doc(db, BOOKINGS_COL, bookingId));
  
  // Update the slot counts
  const slotRef = doc(db, `${SHOPS_COL}/${shopId}/slots`, slotId);
  try {
    await updateDoc(slotRef, {
      currentBookings: isWaitlist ? increment(0) : increment(-1),
      waitlistCount: isWaitlist ? increment(-1) : increment(0)
    });
  } catch (error) {
    console.error("Error updating slot counts during cancellation:", error);
    // Even if slot update fails (e.g. slot doc deleted), we already deleted the booking
  }
};

export const getUserBookingsWithDetails = async (userId: string) => {
  const q = query(collection(db, BOOKINGS_COL), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  const userBookings = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Booking[];

  const bookingsWithDetails = await Promise.all(userBookings.map(async (booking) => {
    try {
      const [shopDoc, slotDoc] = await Promise.all([
        booking.shopId ? getDoc(doc(db, SHOPS_COL, booking.shopId)) : Promise.resolve(null),
        (booking.shopId && booking.slotId) ? getDoc(doc(db, `${SHOPS_COL}/${booking.shopId}/slots`, booking.slotId)) : Promise.resolve(null)
      ]);

      return {
        ...booking,
        shopData: shopDoc?.exists() ? { id: shopDoc.id, ...shopDoc.data() } as Shop : undefined,
        slotData: slotDoc?.exists() ? { id: slotDoc.id, ...slotDoc.data() } as Slot : undefined
      };
    } catch (err) {
      console.error("Failed fetching details for booking", booking.id, err);
      return booking;
    }
  }));


  return bookingsWithDetails as (Booking & { shopData?: Shop; slotData?: Slot })[];
};

// User Profiles
const USERS_COL = "users";

export const getUserProfile = async (userId: string) => {
  const userDoc = await getDoc(doc(db, USERS_COL, userId));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (userId: string, profileData: Partial<Omit<UserProfile, 'id' | 'updatedAt'>>) => {
  const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
  const userRef = doc(db, USERS_COL, userId);
  await setDoc(userRef, {
    ...profileData,
    updatedAt: serverTimestamp()
  }, { merge: true });
};
