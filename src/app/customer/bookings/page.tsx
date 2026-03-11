'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Booking, Shop } from '@/lib/firebase/db';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Ticket, Store } from 'lucide-react';

export default function CustomerBookings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [bookings, setBookings] = useState<(Booking & { shopData?: Shop })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/customer/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      try {
        const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const userBookings = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[];

        const bookingsWithShops = await Promise.all(userBookings.map(async (booking) => {
          const shopDoc = await getDoc(doc(db, 'shops', booking.shopId));
          return {
            ...booking,
            shopData: shopDoc.exists() ? { id: shopDoc.id, ...shopDoc.data() } as Shop : undefined
          };
        }));
        
        setBookings(bookingsWithShops);
      } catch (error) {
        console.error("Error fetching bookings", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-glow-violet rounded-full mix-blend-screen filter blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
      
      <header className="border-b border-foreground/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">
          <button 
            onClick={() => router.push('/customer/dashboard')}
            className="text-foreground-muted hover:text-foreground flex items-center text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 relative z-10 w-full flex-grow">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Bookings</h1>
          <p className="text-foreground-muted">View your active tokens and queue status.</p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-foreground/5 rounded-3xl border border-foreground/5 border-dashed">
            <Ticket size={48} className="mx-auto mb-4 opacity-50 text-foreground-muted" />
            <p className="text-foreground-muted">You have no bookings yet.</p>
            <button 
              onClick={() => router.push('/customer/search')}
              className="mt-6 px-6 py-3 bg-cyan-500/10 text-cyan-500 font-medium rounded-xl hover:bg-cyan-500/20 transition-colors"
            >
              Find a Service
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, idx) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => router.push(`/ticket/${booking.id}`)}
                className="glass-panel p-6 cursor-pointer group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex items-center justify-between"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-cyan-500/0 group-hover:from-violet-500/5 group-hover:to-cyan-500/5 transition-colors duration-500"></div>
                
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground font-bold text-xl border border-foreground/10">
                    <Store size={24} className="opacity-50" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{booking.shopData?.name || 'Unknown Shop'}</h3>
                    <div className="flex items-center text-sm text-foreground-muted space-x-2">
                       <span className="bg-foreground/10 px-2 py-0.5 rounded text-xs text-foreground font-medium">Token #{booking.tokenNumber}</span>
                       <span>•</span>
                       <span className={`capitalize font-medium ${
                         booking.status === 'serving' ? 'text-cyan-500' : 
                         booking.status === 'completed' ? 'text-green-500' : 'text-yellow-500'
                       }`}>
                         {booking.status}
                       </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-foreground-muted group-hover:text-foreground transition-colors relative z-10 w-10 h-10 flex items-center justify-center rounded-full bg-foreground/5 group-hover:bg-foreground group-hover:text-background">
                  <Ticket size={18} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
