import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Booking, Shop, Slot, cancelBooking, getUserBookingsWithDetails } from '@/lib/firebase/db';

export type BookingWithDetails = Booking & { shopData?: Shop; slotData?: Slot };

export function useCustomerBookings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<BookingWithDetails | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Authentication Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/customer/login');
    }
  }, [user, authLoading, router]);

  // Data Fetching
  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      try {
        const bookingsWithDetails = await getUserBookingsWithDetails(user.uid);
        setBookings(bookingsWithDetails);
      } catch (error) {
        console.error("Error fetching bookings", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  // Handlers
  const handleCancel = async (booking: BookingWithDetails) => {
    setActionLoading(true);
    try {
      await cancelBooking(booking.id!, booking.shopId, booking.slotId, booking.isWaitlist);
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      setBookingToDelete(null);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (booking: BookingWithDetails) => {
    setActionLoading(true);
    try {
      await cancelBooking(booking.id!, booking.shopId, booking.slotId, booking.isWaitlist);
      router.push(`/${booking.shopId}`);
    } catch (error) {
      console.error("Error starting reschedule:", error);
      alert("Something went wrong. Please try again.");
      setActionLoading(false);
    }
  };

  return {
    user,
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
  };
}
