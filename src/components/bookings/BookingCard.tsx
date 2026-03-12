'use client';

import { motion } from 'framer-motion';
import { Store, Edit3, Trash2, Ticket } from 'lucide-react';
import { Booking, Shop, Slot } from '@/lib/firebase/db';
import { useRouter } from 'next/navigation';

interface BookingCardProps {
  booking: Booking & { shopData?: Shop; slotData?: Slot };
  idx: number;
  onEdit: (booking: Booking & { shopData?: Shop; slotData?: Slot }) => void;
  onDelete: (booking: Booking & { shopData?: Shop; slotData?: Slot }) => void;
}

export default function BookingCard({ booking, idx, onEdit, onDelete }: BookingCardProps) {
  const router = useRouter();

  return (
    <motion.div
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
      
      <div className="flex items-center space-x-2 relative z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(booking);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground/5 text-foreground-muted hover:bg-cyan-500/10 hover:text-cyan-500 transition-all border border-transparent hover:border-cyan-500/30"
        >
          <Edit3 size={18} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(booking);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground/5 text-foreground-muted hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/30"
        >
          <Trash2 size={18} />
        </button>

        <div className="text-foreground-muted transition-colors w-10 h-10 flex items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground hover:text-black">
          <Ticket size={18} />
        </div>
      </div>
    </motion.div>
  );
}
