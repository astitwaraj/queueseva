'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Shop } from '@/lib/firebase/db';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Loader2, Store, ChevronRight } from 'lucide-react';

export default function CustomerLanding() {
  const router = useRouter();
  const { user, loading: authLoadingContext } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [authLoading, setAuthLoading] = useState<string | null>(null);

  // Auth Guard
  useEffect(() => {
    if (!authLoadingContext && !user) {
      router.push('/customer/login');
    }
  }, [user, authLoadingContext, router]);

  useEffect(() => {
    if (!user) return; // Wait for auth

    const fetchShops = async () => {
      try {
        const q = query(collection(db, 'shops'));
        const querySnapshot = await getDocs(q);
        const shopsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Shop[];
        setShops(shopsList);
      } catch (error) {
        console.error("Error fetching shops", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, [user]);

  const handleShopSelect = async (shopId: string) => {
    setAuthLoading(shopId);
    try {
      if (!user) {
        router.push('/customer/login');
        return;
      }
      router.push(`/${shopId}`);
    } catch (error) {
      console.error("Error routing to shop", error);
      setAuthLoading(null);
    }
  };

  const filteredShops = shops.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-glow-cyan rounded-full mix-blend-screen filter blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-glow-violet rounded-full mix-blend-screen filter blur-[150px] opacity-20 translate-y-1/4 -translate-x-1/4"></div>

      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-foreground/5 py-2 px-4 rounded-full text-sm font-medium mb-6 text-foreground-muted border border-foreground/10">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            <span>Live Queue Tracking Available</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground-muted">
            Skip the line. <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-violet-500">Wait smarter.</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground-muted max-w-2xl mx-auto mb-10">
            Find your destination, join the virtual queue, and get a digital token with live updates on your wait time.
          </p>

          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground-muted">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 md:py-5 border border-foreground/10 rounded-2xl bg-background-card backdrop-blur-md text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-glass text-lg group-hover:border-foreground/20"
              placeholder="Search for hospitals, salons, banks..."
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-cyan-500" size={40} />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {filteredShops.length === 0 ? (
              <div className="col-span-1 md:col-span-2 text-center py-10 text-foreground-muted bg-foreground/5 rounded-3xl border border-foreground/5 border-dashed">
                <Store size={48} className="mx-auto mb-4 opacity-50" />
                <p>No locations found matching your search.</p>
              </div>
            ) : (
              filteredShops.map((shop, i) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => shop.id && handleShopSelect(shop.id)}
                  className="glass-panel p-6 cursor-pointer group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-violet-500/0 group-hover:from-cyan-500/5 group-hover:to-violet-500/5 transition-colors duration-500"></div>
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-foreground/5 to-foreground/10 flex items-center justify-center text-foreground font-bold text-xl border border-foreground/10">
                        {shop.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{shop.name}</h3>
                        <p className="text-sm text-foreground-muted">{shop.category}</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                      {authLoading === shop.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </main>
      
      {/* Decorative footer line */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-violet-500"></div>
    </div>
  );
}
