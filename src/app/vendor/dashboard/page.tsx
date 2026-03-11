'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/lib/firebase/auth';
import { getShopByOwner, Booking, Shop } from '@/lib/firebase/db';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Play, LogOut, Loader2, ArrowRightCircle, Search, Calendar, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VendorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Protected route logic
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/vendor/login');
    }
  }, [user, authLoading, router]);

  // Load Shop details & Real-time Bookings listeners
  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      const shopData = await getShopByOwner(user.uid);
      if (!shopData) {
        // If they registered but haven't onboarded, send them to onboarding
        router.push('/vendor/onboarding');
        return;
      }
      setShop(shopData);

      // Listen to bookings for this shop today
      const q = query(
        collection(db, 'bookings'),
        where('shopId', '==', shopData.id),
        // orderBy('tokenNumber', 'asc') // Note: requires composite index in real DB usually
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bookingsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[];
        
        // Sort in client to avoid firestore index complexites for this demo
        bookingsList.sort((a, b) => a.tokenNumber - b.tokenNumber);
        setBookings(bookingsList);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching bookings:", err);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    loadDashboard();
  }, [user, router]);

  const advanceQueue = async (bookingId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed'
      });
      
      // Auto-set the next waiting person to 'serving'
      const nextWaiting = bookings.find(b => b.status === 'waiting' && b.id !== bookingId);
      if (nextWaiting && nextWaiting.id) {
        await updateDoc(doc(db, 'bookings', nextWaiting.id), {
          status: 'serving'
        });
      }
    } catch (error) {
      console.error("Error advancing queue", error);
    }
  };

  const startServing = async (bookingId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'serving'
      });
    } catch (error) {
      console.error("Error starting service", error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  const currentlyServing = bookings.find(b => b.status === 'serving');
  const waitingList = bookings.filter(b => b.status === 'waiting');

  return (
    <div className="min-h-screen bg-background">
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-foreground/5">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold">
            {shop?.name?.charAt(0) || 'Q'}
          </div>
          <span className="font-bold text-lg tracking-tight">{shop?.name}</span>
        </div>
        <button 
          onClick={() => { logoutUser(); router.push('/vendor/login'); }}
          className="text-foreground-muted hover:text-red-500 transition-colors flex items-center space-x-2 text-sm font-medium"
        >
          <span>Logout</span>
          <LogOut size={16} />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Serving Now Controller (Main Panel) */}
          <div className="md:col-span-2 glass-panel p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 z-0"></div>
            <div className="absolute w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] -top-10 -right-10 pointer-events-none group-hover:bg-cyan-500/30 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Serving Now</h2>
                  <p className="text-sm text-foreground-muted">Live queue controller</p>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 text-sm font-medium border border-cyan-500/20">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                  <span>Live Sync</span>
                </div>
              </div>

              {currentlyServing ? (
                <motion.div 
                  key="serving-active"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-6"
                >
                  <div className="text-8xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-500 to-violet-500 mb-6 drop-shadow-xl">
                    #{currentlyServing.tokenNumber}
                  </div>
                  
                  <button 
                    onClick={() => advanceQueue(currentlyServing.id!)}
                    className="flex items-center space-x-3 bg-foreground text-background py-4 px-8 rounded-full font-semibold text-lg hover:shadow-glow-cyan transition-all hover:-translate-y-1 w-full max-w-sm justify-center group/btn"
                  >
                    <span>Next Customer</span>
                    <ArrowRightCircle className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 flex-1">
                  <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                    <LogOut className="text-foreground-muted" size={32} />
                  </div>
                  <p className="text-foreground-muted text-lg text-center max-w-sm mb-6">
                    No active ticket. Call the next person in line to begin service.
                  </p>
                  <button
                    onClick={() => waitingList[0]?.id && startServing(waitingList[0].id)}
                    disabled={waitingList.length === 0}
                    className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white py-3 px-6 rounded-xl font-medium hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play size={18} fill="currentColor" />
                    <span>Start Queue</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats & Quick Info */}
          <div className="space-y-6 flex flex-col">
            <div className="glass-panel p-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-violet-500/10 rounded-2xl text-violet-500">
                  <Users size={28} />
                </div>
                <div>
                  <p className="text-sm text-foreground-muted font-medium">Waiting List</p>
                  <h3 className="text-3xl font-bold">{waitingList.length}</h3>
                </div>
              </div>
            </div>
            
            <div className="glass-panel p-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-cyan-500/10 rounded-2xl text-cyan-500">
                  <Calendar size={28} />
                </div>
                <div>
                  <p className="text-sm text-foreground-muted font-medium">Total Today</p>
                  <h3 className="text-3xl font-bold">{bookings.length}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Up Next List */}
        <div className="glass-panel p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Up Next</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={16} />
              <input 
                type="text" 
                placeholder="Search ticket..." 
                className="pl-9 pr-4 py-2 text-sm bg-background/50 border border-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {waitingList.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="py-8 text-center text-foreground-muted bg-foreground/5 rounded-xl border border-foreground/5 border-dashed"
                >
                  The waiting list is empty.
                </motion.div>
              ) : (
                waitingList.map((booking, idx) => (
                  <motion.div
                    key={booking.id}
                    layout // Animates position changes
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-foreground/5 bg-background/50 hover:bg-background transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center font-bold text-lg text-foreground-muted">
                        #{booking.tokenNumber}
                      </div>
                      <div>
                        <p className="font-medium">Ticket {booking.tokenNumber}</p>
                        <p className="text-xs text-foreground-muted">{booking.isWaitlist ? 'Waitlisted Token' : 'Regular Booking'}</p>
                      </div>
                    </div>
                    {idx === 0 && !currentlyServing && (
                      <button 
                        onClick={() => startServing(booking.id!)}
                        className="text-sm font-medium text-cyan-600 hover:text-cyan-700 bg-cyan-500/10 hover:bg-cyan-500/20 py-2 px-4 rounded-lg transition-colors"
                      >
                        Call Now
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
