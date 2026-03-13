'use client';

import { ArrowLeft, Clock, Info, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Shop } from '@/lib/firebase/db';

interface ShopHeaderProps {
  shop: Shop;
}

export default function ShopHeader({ shop }: ShopHeaderProps) {
  const router = useRouter();
  
  return (
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
            {shop.shopNumber && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-[10px] text-amber-500 font-bold uppercase tracking-wider border border-amber-500/20">
                {shop.shopNumber}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-[10px] text-cyan-500 font-bold uppercase tracking-wider border border-cyan-500/20">
              {shop.category}
            </span>
            <span className="flex items-center text-foreground-muted text-xs">
              <Clock size={12} className="mr-1" />
              {shop.slotDuration} min / session
            </span>
          </div>
        </div>
        {shop.address && (
          <div className="flex items-center text-foreground-muted text-sm mt-3 font-medium">
            <MapPin size={14} className="mr-1.5 text-cyan-500" />
            <span>{shop.address}, {shop.city}, {shop.state} {shop.zipCode}</span>
          </div>
        )}
      </div>
      
      <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#1a1f2e] border border-white/10 rounded-xl text-xs text-foreground-muted">
        <Info size={14} className="text-cyan-500" />
        <span>Select a date and time to secure your slot</span>
      </div>
    </div>
  );
}
