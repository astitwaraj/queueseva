'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Shop, Slot, Booking, createBooking, getUserProfile } from '@/lib/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, ChevronRight, Loader2, ArrowLeft, Info } from 'lucide-react';
import WaitlistAction from './WaitlistAction';
import Navbar from '@/components/layout/Navbar';

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
      let assignedWaitlistNumber = 0;
      
      const { runTransaction } = await import('firebase/firestore');

      if (!slotId) {
        const { createSlot } = await import('@/lib/firebase/db');
        assignedWaitlistNumber = isWaitlist ? 1 : 0;
        slotId = await createSlot(params.shopId, {
          startTime: selectedTime,
          date: selectedDate,
          currentBookings: isWaitlist ? 0 : 1,
          waitlistCount: isWaitlist ? 1 : 0
        });
      } else {
        const slotRef = doc(db, `shops/${params.shopId}/slots`, slotId);
        
        assignedWaitlistNumber = await runTransaction(db, async (transaction) => {
          const slotDoc = await transaction.get(slotRef);
          if (!slotDoc.exists()) throw new Error("Slot not found");
          
          const currentData = slotDoc.data();
          const currentBookings = currentData.currentBookings || 0;
          const waitlistCount = currentData.waitlistCount || 0;

          if (!isWaitlist && currentBookings >= shop.maxCapacity) {
             throw new Error("Sorry, this slot just became full! Please click it again to join the waitlist.");
          }

          const newWaitlistNumber = isWaitlist ? waitlistCount + 1 : 0;

          transaction.update(slotRef, {
            currentBookings: isWaitlist ? currentBookings : currentBookings + 1,
            waitlistCount: isWaitlist ? waitlistCount + 1 : waitlistCount
          });

          return newWaitlistNumber;
        });
      }

      // Generate a meaningful token number based on user, shop, and slot
      const tokenNumber = generateTokenNumber(user.uid, params.shopId, slotId);

      // Fetch profile to auto-fill details
      const profile = await getUserProfile(user.uid);

      // Create Booking
      const bookingId = await createBooking({
        userId: user.uid,
        shopId: params.shopId,
        slotId: slotId, 
        tokenNumber: tokenNumber,
        status: 'waiting',
        isWaitlist,
        waitlistNumber: assignedWaitlistNumber,
        userName: profile?.displayName || user.displayName || 'Guest',
        userEmail: profile?.email || user.email || '',
        userPhone: profile?.phoneNumber || '',
        showContactToVendor: profile?.showContactToVendor ?? true
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
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar subtitle="Booking" />

      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-glow-cyan rounded-full mix-blend-screen filter blur-[150px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>
      
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10 w-full flex-grow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex-grow">
            <button 
              onClick={() => router.back()}
              className="text-foreground-muted hover:text-foreground flex items-center text-sm font-medium transition-colors mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </button>
            <div className="flex flex-col md:flex-row md:items-end md:gap-4">
              <h1 className="text-4xl font-bold tracking-tight">{shop.name}</h1>
              <div className="flex items-center gap-2 mt-2 md:mt-0 md:mb-1">
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-[10px] text-cyan-500 font-bold uppercase tracking-wider border border-cyan-500/20">
                  {shop.category}
                </span>
                <span className="flex items-center text-foreground-muted text-xs">
                  <Clock size={12} className="mr-1" />
                  {shop.slotDuration} min / session
                </span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#1a1f2e] border border-white/10 rounded-xl text-xs text-foreground-muted">
            <Info size={14} className="text-cyan-500" />
            <span>Select a date and time to secure your slot</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Side: Date & Time Selection */}
          <div className="lg:col-span-8 space-y-10">
            {/* Date Picker */}
            <section>
              <div className="flex items-center space-x-2 mb-6 text-sm font-semibold uppercase tracking-widest text-foreground-muted/60">
                <Calendar size={16} className="text-cyan-500" />
                <span>Choose Your Date</span>
              </div>
              
              <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {days.map((d) => (
                  <button
                    key={d.dateStr}
                    onClick={() => { setSelectedDate(d.dateStr); setSelectedTime(null); }}
                    className={`flex-shrink-0 w-24 flex flex-col items-center py-4 rounded-2xl border transition-all snap-start ${
                      selectedDate === d.dateStr
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 shadow-glow-cyan'
                        : 'border-white/5 bg-[#1a1f2e] hover:border-white/20 text-foreground'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase mb-1 opacity-60">{d.dayName}</span>
                    <span className="text-2xl font-bold">{d.dayNumber}</span>
                    <span className="text-[10px] mt-1 font-medium opacity-60 uppercase">{d.monthName}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Time Slots */}
            <section>
              <div className="flex items-center space-x-2 mb-6 text-sm font-semibold uppercase tracking-widest text-foreground-muted/60">
                <Clock size={16} className="text-cyan-500" />
                <span>Available Slots</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {generatedTimeSlots.map((time) => {
                  const state = getSlotState(time);
                  const isSelected = selectedTime === time;

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
                      className={`relative py-4 px-2 rounded-xl border text-sm font-bold transition-all text-center flex flex-col items-center justify-center min-h-[70px] ${
                        state === 'already_booked' ? 'border-red-500/30 bg-red-500/5 text-red-500/50 cursor-not-allowed opacity-60' :
                        isSelected ? (state === 'full' ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500 shadow-glow-yellow' : 'border-cyan-500 bg-cyan-500/10 text-cyan-500 shadow-glow-cyan') :
                        state === 'full' ? 'border-yellow-500/20 bg-[#1a1f2e] text-yellow-500/70 hover:border-yellow-500/50' :
                        'border-white/5 bg-[#1a1f2e] text-foreground/80 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{formatTime(time).split(' ')[0]}</span>
                      <span className="text-[10px] opacity-60 uppercase">{formatTime(time).split(' ')[1]}</span>
                      
                      {state === 'full' && (
                        <div className="absolute top-1 right-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        </div>
                      )}
                      {state === 'already_booked' && <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Booked</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Side: Info Panel or Selection Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 border-white/5 bg-[#1a1f2e]/50 backdrop-blur-md sticky top-32">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Info className="text-cyan-500 mr-2" size={20} />
                Booking Summary
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-foreground-muted" />
                    <span className="text-sm font-medium">Date</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-foreground-muted" />
                    <span className="text-sm font-medium">Time</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {selectedTime ? formatTime(selectedTime) : 'Not selected'}
                  </span>
                </div>
              </div>

              {!selectedTime ? (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                    <ArrowLeft size={24} className="text-foreground-muted animate-pulse" />
                  </div>
                  <p className="text-sm text-foreground-muted">Please select a time slot to continue your booking</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isSelectedFull ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500' : 'border-cyan-500/20 bg-cyan-500/5 text-cyan-500'
                  }`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1">
                      {isSelectedFull ? 'Low Availability' : 'High Availability'}
                    </p>
                    <p className="text-sm leading-relaxed text-foreground-muted">
                      {isSelectedFull 
                        ? 'This slot is currently at max capacity. You can join the waitlist for a chance to be served.' 
                        : 'Great choice! This slot is available for an immediate confirmed booking.'}
                    </p>
                  </div>

                  <div className="pt-4">
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
                            <span>Confirm Booking</span>
                            <ChevronRight size={18} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

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
