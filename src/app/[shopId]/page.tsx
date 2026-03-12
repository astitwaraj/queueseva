'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Shop, Slot, Booking, createBooking } from '@/lib/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import WaitlistAction from './WaitlistAction';

// Utility to generate days for the horizontal picker
const generateDays = (numDays: number) => {
  const days = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' })
    });
  }
  return days;
};

// Utility to format 24h time to 12h AM/PM
const formatTime = (time24: string) => {
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minStr} ${ampm}`;
};

// Utility to generate time slots (09:00 to 17:00)
const generateTimeSlots = (duration: number) => {
  const slots = [];
  let currentTime = 9 * 60; // 9:00 AM in minutes
  const endTime = 17 * 60; // 5:00 PM

  while (currentTime < endTime) {
    const hours = Math.floor(currentTime / 60);
    const mins = currentTime % 60;
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    slots.push(timeStr);
    currentTime += duration;
  }
  return slots;
};

// Utility to generate a meaningful token number
const generateTokenNumber = (uid: string, shopId: string, slotId: string) => {
  const combined = `${uid}-${shopId}-${slotId}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Generate a 4-digit number (1000-9999)
  return Math.abs(hash % 9000) + 1000;
};

export default function ShopBookingView({ params }: { params: { shopId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const days = generateDays(14); // Next 14 days
  const [selectedDate, setSelectedDate] = useState(days[0].dateStr);
  const [dbSlots, setDbSlots] = useState<{ [time: string]: Slot }>({});
  const [userBookings, setUserBookings] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/customer/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchShopAndSlots = async () => {
      try {
        setLoading(true);
        // Fetch Shop Info
        const shopDoc = await getDoc(doc(db, 'shops', params.shopId));
        if (shopDoc.exists()) {
          setShop({ id: shopDoc.id, ...shopDoc.data() } as Shop);
        }

        // Listen to active slots for selected date to show capacity
        const qSlots = query(collection(db, `shops/${params.shopId}/slots`), where('date', '==', selectedDate));
        const unsubscribeSlots = onSnapshot(qSlots, (snapshot) => {
          const slotMap: { [time: string]: Slot } = {};
          snapshot.forEach(doc => {
            const data = doc.data() as Slot;
            slotMap[data.startTime] = { id: doc.id, ...data };
          });
          setDbSlots(slotMap);
          setLoading(false);
        });

        // Listen to user's active bookings to prevent double booking
        let unsubscribeBookings = () => {};
        if (user) {
          const qBookings = query(collection(db, 'bookings'), where('userId', '==', user.uid));
          unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
            const bookedSlotIds = new Set<string>();
            snapshot.forEach(doc => {
              const b = doc.data() as Booking;
              if (b.shopId === params.shopId && (b.status === 'waiting' || b.status === 'serving')) {
                bookedSlotIds.add(b.slotId);
              }
            });
            setUserBookings(bookedSlotIds);
          });
        }

        return () => {
          unsubscribeSlots();
          unsubscribeBookings();
        };
      } catch (error) {
        console.error("Error fetching data", error);
        setLoading(false);
      }
    };

    if (user) {
      const cleanup = fetchShopAndSlots();
      return () => {
        cleanup.then(unsub => unsub && unsub());
      };
    }
  }, [params.shopId, selectedDate, user]);

  const handleBookSlot = async (isWaitlist: boolean = false) => {
    if (!user || !shop || !selectedTime) return;
    setBookingLoading(true);

    try {
      let slotId = dbSlots[selectedTime]?.id;
      
      const { runTransaction } = await import('firebase/firestore');

      if (!slotId) {
        const { createSlot } = await import('@/lib/firebase/db');
        slotId = await createSlot(params.shopId, {
          startTime: selectedTime,
          date: selectedDate,
          currentBookings: isWaitlist ? 0 : 1,
          waitlistCount: isWaitlist ? 1 : 0
        });
      } else {
        const slotRef = doc(db, `shops/${params.shopId}/slots`, slotId);
        
        await runTransaction(db, async (transaction) => {
          const slotDoc = await transaction.get(slotRef);
          if (!slotDoc.exists()) throw new Error("Slot not found");
          
          const currentData = slotDoc.data();
          const currentBookings = currentData.currentBookings || 0;
          const waitlistCount = currentData.waitlistCount || 0;

          if (!isWaitlist && currentBookings >= shop.maxCapacity) {
             throw new Error("Sorry, this slot just became full! Please click it again to join the waitlist.");
          }

          transaction.update(slotRef, {
            currentBookings: isWaitlist ? currentBookings : currentBookings + 1,
            waitlistCount: isWaitlist ? waitlistCount + 1 : waitlistCount
          });
        });
      }

      // Generate a meaningful token number based on user, shop, and slot
      const tokenNumber = generateTokenNumber(user.uid, params.shopId, slotId);

      // Create Booking
      const bookingId = await createBooking({
        userId: user.uid,
        shopId: params.shopId,
        slotId: slotId, // Guaranteed to be a string here
        tokenNumber: tokenNumber,
        status: 'waiting',
        isWaitlist
      });

      router.push(`/ticket/${bookingId}`);

    } catch (error: unknown) {
      console.error("Error booking slot", error);
      setToastMessage(error instanceof Error ? error.message : "Failed to book slot. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || authLoading || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  const generatedTimeSlots = generateTimeSlots(shop.slotDuration);

  // Determine slot state
  const getSlotState = (time: string) => {
    const slotData = dbSlots[time];
    if (slotData && slotData.id && userBookings.has(slotData.id)) return 'already_booked';
    if (!slotData) return 'available'; // No bookings yet
    if (slotData.currentBookings >= shop.maxCapacity) return 'full';
    return 'available';
  };

  const selectedSlotData = selectedTime ? dbSlots[selectedTime] : null;
  const isSelectedFull = selectedTime ? getSlotState(selectedTime) === 'full' : false;

  return (
    <div className="min-h-screen bg-background pb-32">
       <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center border-b border-foreground/5">
        <button onClick={() => router.back()} className="text-foreground-muted hover:text-foreground mr-4">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="font-bold text-lg">{shop.name}</h1>
          <p className="text-xs text-foreground-muted">{shop.category}</p>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-8 mt-4">
        
        {/* Date Picker (Horizontal) */}
        <div>
          <div className="flex items-center space-x-2 mb-4 text-sm font-medium text-foreground-muted">
            <Calendar size={16} />
            <span>Select Date</span>
          </div>
          
          <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {days.map((d) => (
              <button
                key={d.dateStr}
                onClick={() => { setSelectedDate(d.dateStr); setSelectedTime(null); }}
                className={`flex-shrink-0 w-20 flex flex-col items-center py-3 rounded-2xl border transition-all snap-start ${
                  selectedDate === d.dateStr
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 shadow-glow-cyan'
                    : 'border-foreground/10 bg-background-card hover:bg-foreground/5 text-foreground'
                }`}
              >
                <span className="text-xs font-semibold uppercase mb-1">{d.dayName}</span>
                <span className="text-2xl font-bold">{d.dayNumber}</span>
                <span className="text-xs mt-1 opacity-70">{d.monthName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots Grid */}
        <div>
          <div className="flex items-center space-x-2 mb-4 text-sm font-medium text-foreground-muted">
            <Clock size={16} />
            <span>Select Time</span>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {generatedTimeSlots.map((time) => {
              const state = getSlotState(time);
              const isSelected = selectedTime === time;

              // Styling per state
              const baseStyles = "py-3 rounded-xl border text-sm font-medium transition-all text-center";
              let stateStyles = "";

              if (state === 'available') {
                stateStyles = isSelected 
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  : "border-foreground/10 bg-background-card text-foreground hover:border-cyan-500/50";
              } else if (state === 'full') {
                stateStyles = isSelected
                  ? "border-yellow-500 bg-yellow-500/10 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                  : "border-yellow-500/30 bg-yellow-500/5 text-yellow-500/90 hover:border-yellow-500/50";
              } else if (state === 'already_booked') {
                stateStyles = "border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)] cursor-not-allowed";
              }

              return (
                 <button
                 key={time}
                 onClick={() => {
                   if (state === 'already_booked') {
                     setToastMessage("You have already booked this slot!");
                     return;
                   }
                   setSelectedTime(time);
                 }}
                 className={`${baseStyles} ${stateStyles}`}
               >
                 <span>{formatTime(time)}</span>
                 {state === 'full' && (
                   <div className="flex items-center justify-center mt-0.5 space-x-1">
                     <span className="block text-[10px] uppercase font-bold text-yellow-500">Waitlist</span>
                     {(dbSlots[time]?.waitlistCount || 0) > 0 && (
                       <span className="bg-yellow-500/20 text-yellow-500 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                         {dbSlots[time].waitlistCount}
                       </span>
                     )}
                   </div>
                 )}
                 {state === 'already_booked' && <span className="block text-[10px] uppercase mt-0.5 font-bold">Booked</span>}
               </button>
              );
            })}
          </div>
        </div>

      </main>

      {/* Floating Action Menu */}
      <AnimatePresence>
        {selectedTime && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 w-full glass border-t border-foreground/10 p-4 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
          >
            <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-6">
              
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className={`px-4 h-12 flex-shrink-0 rounded-xl flex items-center justify-center font-bold text-sm ${
                  isSelectedFull ? 'bg-yellow-500/20 text-yellow-500' : 'bg-cyan-500/20 text-cyan-500'
                }`}>
                  {formatTime(selectedTime)}
                </div>
                <div>
                  <p className="font-semibold">{isSelectedFull ? 'Slot is Full' : 'Slot Available'}</p>
                  <p className="text-xs text-foreground-muted">
                    {isSelectedFull ? 'Join waitlist to get next priority.' : 'Book now to secure your spot.'}
                  </p>
                </div>
              </div>

              <div className="w-full md:w-auto">
                {isSelectedFull ? (
                  <WaitlistAction
                    waitlistCount={selectedSlotData?.waitlistCount || 0} 
                    maxCapacity={shop.maxCapacity}
                    onJoin={() => handleBookSlot(true)}
                    loading={bookingLoading}
                  />
                ) : (
                  <button
                    onClick={() => handleBookSlot(false)}
                    disabled={bookingLoading}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black py-4 px-8 rounded-xl font-bold hover:shadow-glow-cyan transition-all disabled:opacity-70"
                  >
                    {bookingLoading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        <span>Secure Booking</span>
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-red-500 text-white px-6 py-3 rounded-full font-medium shadow-glow-red flex items-center space-x-2 whitespace-nowrap"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
