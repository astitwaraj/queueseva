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
  getDoc,
  runTransaction,
  increment,
  setDoc,
  DocumentReference
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
  address: string;
  city: string;
  state: string;
  zipCode: string;
  shopNumber: string;
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

export const checkShopNumberUnique = async (shopNumber: string) => {
  const q = query(collection(db, SHOPS_COL), where("shopNumber", "==", shopNumber));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
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

export const cancelBooking = async (bookingId: string, shopId: string, slotId: string) => {
  // 1. Pre-fetch potentially affected waitlisted bookings
  // We do this outside the transaction because Web SDK doesn't support queries inside transactions.
  // We'll re-verify them inside the transaction to ensure atomicity.
  // Simplify the query to only use slotId to avoid needing a composite index.
  // We filter and sort in memory since the number of bookings per slot is small.
  const q = query(
    collection(db, BOOKINGS_COL),
    where("slotId", "==", slotId)
  );
  
  try {
    const snapshot = await getDocs(q);
    // Sort and filter in memory to find waitlisted bookings
    const potentiallyAffectedRefs = snapshot.docs
      .filter(d => {
        const data = d.data();
        return d.id !== bookingId && 
               data.status === 'waiting' && 
               data.isWaitlist === true;
      })
      .sort((a, b) => (a.data().waitlistNumber || 0) - (b.data().waitlistNumber || 0))
      .map(d => d.ref);

    await runTransaction(db, async (transaction) => {
      const bookingRef = doc(db, BOOKINGS_COL, bookingId);
      const bookingDoc = await transaction.get(bookingRef);
      
      if (!bookingDoc.exists()) return;

      const bookingData = bookingDoc.data() as Booking;
      const wasWaitlist = bookingData.isWaitlist;
      const deletedWLNumber = bookingData.waitlistNumber || 0;

      const slotRef = doc(db, `${SHOPS_COL}/${shopId}/slots`, slotId);
      const slotSnap = await transaction.get(slotRef);
      
      if (!slotSnap.exists()) return;

      // Re-read affected waitlisted bookings inside the transaction to ensure we have the latest state
      const activeWaitlist: { ref: DocumentReference, data: Booking }[] = [];
      for (const ref of potentiallyAffectedRefs) {
        const snap = await transaction.get(ref);
        if (snap.exists() && snap.data().status === 'waiting' && snap.data().isWaitlist) {
          activeWaitlist.push({ ref, data: snap.data() as Booking });
        }
      }

      // --- ALL WRITES START HERE ---
      
      // Delete the target booking
      transaction.delete(bookingRef);

      if (!wasWaitlist) {
        // Case: A confirmed booking was deleted
        if (activeWaitlist.length > 0) {
          // Promote the first waitlisted person
          const first = activeWaitlist[0];
          transaction.update(first.ref, { 
            isWaitlist: false, 
            waitlistNumber: 0 
          });

          // Shift all other waitlisted persons up
          for (let i = 1; i < activeWaitlist.length; i++) {
            const b = activeWaitlist[i];
            const currentWL = b.data.waitlistNumber || 0;
            transaction.update(b.ref, { 
              waitlistNumber: Math.max(1, currentWL - 1) 
            });
          }
          
          // Decrement waitlist count (currentBookings stays same since one was promoted)
          transaction.update(slotRef, { waitlistCount: increment(-1) });
        } else {
          // No one on waitlist, just decrement confirmed count
          transaction.update(slotRef, { currentBookings: increment(-1) });
        }
      } else {
        // Case: A waitlisted booking was deleted
        // Shift all subsequent waitlisted persons up
        for (const b of activeWaitlist) {
          const currentWL = b.data.waitlistNumber || 0;
          if (currentWL > deletedWLNumber) {
            transaction.update(b.ref, { 
              waitlistNumber: Math.max(1, currentWL - 1) 
            });
          }
        }
        
        // Decrement waitlist count
        transaction.update(slotRef, { waitlistCount: increment(-1) });
      }
    });
  } catch (error) {
    console.error("Error in cancelBooking transaction:", error);
    throw error;
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
  const userRef = doc(db, USERS_COL, userId);
  await setDoc(userRef, {
    ...profileData,
    updatedAt: serverTimestamp()
  }, { merge: true });
};
