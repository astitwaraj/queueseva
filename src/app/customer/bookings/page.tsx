'use client';

import { Loader2, ArrowLeft } from 'lucide-react';
import { useCustomerBookings } from '@/hooks/useCustomerBookings';
import Navbar from '@/components/layout/Navbar';

// Extracted Components
import BookingCard from '@/components/bookings/BookingCard';
import ManageBookingModal from '@/components/bookings/ManageBookingModal';
import DeleteBookingModal from '@/components/bookings/DeleteBookingModal';
import EmptyBookings from '@/components/bookings/EmptyBookings';

export default function CustomerBookings() {
  const {
    authLoading,
    bookings,
    loading,
    selectedBooking,
    setSelectedBooking,
    bookingToDelete,
    setBookingToDelete,
    actionLoading,
    handleCancel,
    handleReschedule,
    router
  } = useCustomerBookings();

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
      
      <Navbar subtitle="Bookings" />
      
      <div className="max-w-5xl mx-auto px-6 py-4">
        <button 
          onClick={() => router.push('/customer/dashboard')}
          className="text-foreground-muted hover:text-foreground flex items-center text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </button>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-12 relative z-10 w-full flex-grow">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Bookings</h1>
          <p className="text-foreground-muted">View your active tokens and queue status.</p>
        </div>

        {bookings.length === 0 ? (
          <EmptyBookings />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, idx) => (
              <BookingCard 
                key={booking.id}
                booking={booking}
                idx={idx}
                onEdit={setSelectedBooking}
                onDelete={setBookingToDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Edit/Reschedule Modal */}
      <ManageBookingModal 
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onReschedule={handleReschedule}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteBookingModal 
        booking={bookingToDelete}
        onClose={() => setBookingToDelete(null)}
        onConfirm={handleCancel}
        loading={actionLoading}
      />
    </div>
  );
}
