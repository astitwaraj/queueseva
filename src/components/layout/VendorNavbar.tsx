'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, ChevronDown, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logoutUser } from '@/lib/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Shop } from '@/lib/firebase/db';
import VendorProfileModal from './VendorProfileModal';

interface VendorNavbarProps {
  shop: Shop | null;
  onShopUpdate: (updatedShop: Shop) => void;
}

export default function VendorNavbar({ shop, onShopUpdate }: VendorNavbarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/vendor/login');
  };

  return (
    <>
      <header className="border-b border-foreground/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center cursor-pointer space-x-3" 
            onClick={() => router.push('/vendor/dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-glow-cyan/20">
              {shop?.name?.charAt(0) || <Store size={18} />}
            </div>
            <div className="font-bold text-xl tracking-tight hidden md:block">
              {shop?.name || "Queue Seva"} <span className="text-cyan-500 font-medium text-sm ml-1 opacity-80">Vendor</span>
            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-foreground/5 transition-all border border-transparent hover:border-foreground/10 group"
            >
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground-muted group-hover:text-cyan-500 transition-colors">
                <User size={18} />
              </div>
              <div className="hidden sm:block text-left mr-1">
                <p className="text-xs font-bold leading-none">{user?.displayName || 'Vendor Account'}</p>
                <p className="text-[10px] text-foreground-muted truncate max-w-[100px]">{user?.email}</p>
              </div>
              <ChevronDown size={14} className={`text-foreground-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-[#1a1f2e] border border-white/10 shadow-2xl rounded-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-white/5 bg-white/5">
                    <p className="text-xs font-bold text-foreground">Logged in as</p>
                    <p className="text-xs text-foreground-muted truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        setIsProfileModalOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-cyan-500/10 hover:text-cyan-500 transition-all group"
                    >
                      <Settings size={16} className="mr-3 text-foreground-muted group-hover:text-cyan-500 transition-colors" />
                      Settings
                    </button>
                    <div className="h-px bg-white/5 my-1.5 mx-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all group text-foreground/80"
                    >
                      <LogOut size={16} className="mr-3 text-foreground-muted group-hover:text-red-500 transition-colors" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <VendorProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        shopData={shop}
        onShopUpdate={onShopUpdate}
      />
    </>
  );
}
