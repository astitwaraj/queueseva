'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { createShop } from '@/lib/firebase/db';
import { Store, Clock, Users, ArrowRight, Loader2 } from 'lucide-react';

const CATEGORIES = ['Healthcare', 'Salon', 'Restaurant', 'Bank', 'Retail'];
const SLOT_DURATIONS = [15, 30, 45, 60];

export default function VendorOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    slotDuration: 30,
    maxCapacity: 10,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/vendor/login');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await createShop({
        ownerId: user.uid,
        name: formData.name,
        category: formData.category,
        slotDuration: formData.slotDuration,
        maxCapacity: formData.maxCapacity,
        avgCancellationRate: 0,
      });
      router.push('/vendor/dashboard');
    } catch (error) {
      console.error('Error creating shop:', error);
      // Handle error gracefully in real app (toast notification, etc.)
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-background/50 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-glow-cyan rounded-full mix-blend-screen filter blur-[128px] opacity-30"></div>
      
      <div className="w-full max-w-2xl relative z-10 glass-panel p-8 md:p-12 overflow-hidden">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold tracking-tight">Set up your Store</h1>
            <span className="text-sm font-medium text-foreground-muted bg-foreground/5 px-3 py-1 rounded-full">
              Step {step} of 3
            </span>
          </div>
          <div className="w-full bg-foreground/10 h-1 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium mb-3 text-foreground/80">Store Name</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={20} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-4 rounded-xl border border-foreground/10 bg-background-card text-foreground focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all text-lg"
                    placeholder="e.g. Apollo Hospital Clinic"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-foreground/80">Category</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`py-3 px-4 rounded-xl border transition-all text-sm font-medium ${
                        formData.category === cat 
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                          : 'border-foreground/10 bg-background-card text-foreground hover:bg-foreground/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  disabled={!formData.name || !formData.category}
                  onClick={() => setStep(2)}
                  className="flex items-center space-x-2 bg-foreground text-background py-3 px-6 rounded-xl font-medium hover:bg-foreground/90 transition-all disabled:opacity-50"
                >
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium mb-4 text-foreground/80">
                  <Clock size={18} />
                  <span>Average duration per customer (Minutes)</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {SLOT_DURATIONS.map(dur => (
                    <button
                      key={dur}
                      onClick={() => setFormData({ ...formData, slotDuration: dur })}
                      className={`py-4 rounded-xl border text-center transition-all ${
                        formData.slotDuration === dur 
                          ? 'border-violet-500 bg-violet-500/10 text-violet-600 shadow-[0_0_15px_rgba(167,139,250,0.2)]' 
                          : 'border-foreground/10 bg-background-card hover:bg-foreground/5'
                      }`}
                    >
                      <span className="text-xl font-bold">{dur}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-8 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-foreground-muted hover:text-foreground font-medium transition-colors py-3 px-4"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center space-x-2 bg-foreground text-background py-3 px-6 rounded-xl font-medium hover:bg-foreground/90 transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
               <div>
                <label className="flex items-center space-x-2 text-sm font-medium mb-4 text-foreground/80">
                  <Users size={18} />
                  <span>Maximum capacity per slot</span>
                </label>
                <p className="text-sm text-foreground-muted mb-6">
                  How many customers can you serve simultaneously within a {formData.slotDuration}-minute window?
                </p>
                
                <div className="flex items-center justify-center space-x-6 py-8">
                  <button 
                    onClick={() => setFormData(p => ({ ...p, maxCapacity: Math.max(1, p.maxCapacity - 1) }))}
                    className="w-12 h-12 rounded-full border border-foreground/10 flex items-center justify-center hover:bg-foreground/5 text-2xl font-medium"
                  >
                    -
                  </button>
                  <div className="text-5xl font-bold w-24 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-violet-500 tracking-tighter">
                    {formData.maxCapacity}
                  </div>
                  <button 
                    onClick={() => setFormData(p => ({ ...p, maxCapacity: p.maxCapacity + 1 }))}
                    className="w-12 h-12 rounded-full border border-foreground/10 flex items-center justify-center hover:bg-foreground/5 text-2xl font-medium"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-8 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="text-foreground-muted hover:text-foreground font-medium transition-colors py-3 px-4"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white py-3 px-8 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Complete Setup</span>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
