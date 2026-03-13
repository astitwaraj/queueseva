'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import VendorNavbar from '@/components/layout/VendorNavbar';
import { useVendorDashboard, EnhancedBooking } from './hooks/useVendorDashboard';
import ServingNowCard from './components/ServingNowCard';
import StatsOverview from './components/StatsOverview';
import QueueList from './components/QueueList';
import NoShowModal from './components/NoShowModal';
import ManualBookingModal from './components/ManualBookingModal';

export default function VendorDashboard() {
  const {
    shop,
    setShop,
    currentlyServing,
    waitingList,
    stats,
    loading,
    searchQuery,
    setSearchQuery,
    handleAdvanceQueue,
    handleStartServing,
    handleNoShow
  } = useVendorDashboard();

  const [noShowBooking, setNoShowBooking] = useState<EnhancedBooking | null>(null);
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-cyan-500" size={48} />
          <p className="text-foreground-muted font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <VendorNavbar shop={shop} onShopUpdate={(updatedShop) => setShop(updatedShop)} />

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendor Dashboard</h1>
            <p className="text-foreground-muted">Manage your queue and customers in real-time</p>
          </div>
        </div>

        {/* Top Section: Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ServingNowCard 
            currentlyServing={currentlyServing}
            waitingList={waitingList}
            onAdvance={handleAdvanceQueue}
            onStart={handleStartServing}
            onNoShow={(b) => setNoShowBooking(b)}
          />
          
          <StatsOverview 
            stats={stats} 
            onAddWalkIn={() => setIsManualBookingOpen(true)}
          />
        </div>

        {/* Bottom Section: Full Queue */}
        <QueueList 
          waitingList={waitingList}
          currentlyServingId={currentlyServing?.id}
          onStart={handleStartServing}
          onNoShow={(b) => setNoShowBooking(b)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Modals */}
        <NoShowModal 
          isOpen={!!noShowBooking}
          onClose={() => setNoShowBooking(null)}
          customerName={noShowBooking?.userName || 'Customer'}
          tokenNumber={noShowBooking?.tokenNumber || 0}
          onConfirm={(reason) => {
            if (noShowBooking) {
              handleNoShow(noShowBooking.id!, reason);
              setNoShowBooking(null);
            }
          }}
        />

        <ManualBookingModal 
          isOpen={isManualBookingOpen}
          onClose={() => setIsManualBookingOpen(false)}
          shopId={shop?.id || ''}
          onSuccess={() => {}}
        />
      </main>
    </div>
  );
}
