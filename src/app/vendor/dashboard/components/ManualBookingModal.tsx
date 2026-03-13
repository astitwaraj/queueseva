import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Phone, User, Clock, Loader2 } from 'lucide-react';
import { vendorService } from '@/services/vendorService';
import { Slot } from '@/lib/firebase/db';
import { formatDateLocal } from '@/lib/utils/slot-utils';

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  onSuccess: () => void;
}

export default function ManualBookingModal({ isOpen, onClose, shopId, onSuccess }: ManualBookingModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && shopId) {
      const fetchSlots = async () => {
        setLoading(true);
        try {
          const today = formatDateLocal(new Date());
          const availableSlots = await vendorService.getAvailableSlots(shopId, today);
          setSlots(availableSlots.sort((a,b) => a.startTime.localeCompare(b.startTime)));
          // Select first available slot by default
          if (availableSlots.length > 0) setSelectedSlotId(availableSlots[0].id!);
        } catch (err) {
          console.error("Error fetching slots", err);
        } finally {
          setLoading(false);
        }
      };
      fetchSlots();
    }
  }, [isOpen, shopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedSlotId) return;

    setSaving(true);
    try {
      await vendorService.addManualBooking(shopId, selectedSlotId, name, phone);
      setName('');
      setPhone('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error adding manual booking", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
        
        <motion.div
           initial={{ opacity: 0, scale: 0.9, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.9, y: 20 }}
           className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
         >
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2 text-cyan-500">
                <UserPlus size={20} />
                <h3 className="font-bold text-lg">Add Walk-in Customer</h3>
              </div>
              <button type="button" onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground-muted mb-2 block flex items-center gap-2">
                  <User size={14} />
                  Customer Name
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-input border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground-muted mb-2 block flex items-center gap-2">
                  <Phone size={14} />
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground-muted mb-2 block flex items-center gap-2">
                  <Clock size={14} />
                  Select Slot
                </label>
                {loading ? (
                  <div className="flex items-center gap-2 text-foreground-muted py-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-sm">Loading slots...</span>
                  </div>
                ) : (
                  <select
                    required
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 appearance-none"
                  >
                    {slots.length === 0 ? (
                      <option value="" className="bg-card">No slots available</option>
                    ) : (
                      slots.map(slot => (
                        <option key={slot.id} value={slot.id} className="bg-card">
                          {slot.startTime} ({slot.currentBookings} booked)
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-medium border border-foreground/10 hover:bg-foreground/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name || !selectedSlotId}
                className="flex-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white py-3 px-6 rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                Add to Queue
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
