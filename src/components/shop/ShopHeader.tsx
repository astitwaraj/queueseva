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
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tight text-foreground">{shop.name}</h1>
            {shop.shopNumber && (
              <span className="px-2 py-1 rounded-md bg-amber-500/10 text-[10px] text-amber-500 font-black uppercase tracking-widest border border-amber-500/20 shadow-sm">
                Shop No. {shop.shopNumber}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-[10px] text-cyan-500 font-bold uppercase tracking-wider border border-cyan-500/20">
              {shop.category}
            </span>
            <div className="h-4 w-px bg-foreground/10" />
            <span className="flex items-center text-foreground-muted text-[11px] font-medium uppercase tracking-wider">
              <Clock size={12} className="mr-1.5 text-cyan-500" />
              {shop.slotDuration} min / session
            </span>
          </div>
        </div>

        {shop.address && (
          <div className="flex items-center text-foreground-muted text-[13px] mt-4 font-medium max-w-2xl leading-relaxed">
            <MapPin size={14} className="mr-2 text-cyan-500 flex-shrink-0" />
            <span className="opacity-80">
              {shop.address}, <span className="text-foreground/60">{shop.city}, {shop.state} {shop.zipCode}</span>
            </span>
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
