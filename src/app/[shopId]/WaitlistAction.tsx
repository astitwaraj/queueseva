'use client';

import { motion } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';

interface WaitlistActionProps {
  waitlistCount: number;
  maxCapacity: number;
  onJoin: () => void;
  loading: boolean;
}

export default function WaitlistAction({ waitlistCount, maxCapacity, onJoin, loading }: WaitlistActionProps) {
  
  // Calculate probability (Cult.fit style)
  // Ensure we don't go below 5% for hope, and max is 99% if someone is first in waitlist
  const probability = Math.max(5, Math.floor((1 - (waitlistCount / maxCapacity)) * 100));
  
  // Determine color based on probability
  let probColor = 'text-green-500';
  let probBg = 'bg-green-500/10';
  
  if (probability < 40) {
    probColor = 'text-red-500';
    probBg = 'bg-red-500/10';
  } else if (probability < 70) {
    probColor = 'text-yellow-500';
    probBg = 'bg-yellow-500/10';
  }

  return (
    <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
      {/* Probability Indicator */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border border-foreground/5 shadow-inner ${probBg}`}
      >
        <span className={`font-bold text-lg md:text-xl ${probColor}`}>{probability}%</span>
        <span className="text-[10px] md:text-xs text-foreground-muted font-medium uppercase tracking-wider">
          Confirmation Prob.
        </span>
      </motion.div>

      {/* Action Button */}
      <button
        onClick={onJoin}
        disabled={loading}
        className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-violet-600 to-violet-500 text-white py-4 px-6 md:px-8 rounded-xl font-bold hover:shadow-glow-violet transition-all disabled:opacity-70 group"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <>
            <span>Join Waitlist</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
}
