'use client';

import { MapPin, Building, Globe, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

import { OnboardingData } from '../hooks/useOnboardingForm';

interface AddressStepProps {
  formData: OnboardingData;
  updateField: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function AddressStep({ formData, updateField, onNext, onPrev }: AddressStepProps) {
  const isComplete = formData.address && formData.city && formData.state && formData.zipCode;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 ml-1">Full Address</label>
        <div className="relative group">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted group-focus-within:text-cyan-500 transition-colors" size={20} />
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-foreground/10 bg-background-card text-foreground focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-base"
            placeholder="No. 12, Main Street, Area"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 ml-1">City</label>
          <div className="relative group">
            <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted group-focus-within:text-cyan-500 transition-colors" size={18} />
            <input
              type="text"
              value={formData.city}
              onChange={(e) => updateField('city', e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-foreground/10 bg-background-card text-foreground focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-base"
              placeholder="Mumbai"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 ml-1">State</label>
          <div className="relative group">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted group-focus-within:text-cyan-500 transition-colors" size={18} />
            <input
              type="text"
              value={formData.state}
              onChange={(e) => updateField('state', e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-foreground/10 bg-background-card text-foreground focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-base"
              placeholder="Maharashtra"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 ml-1">ZIP / PIN Code</label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted group-focus-within:text-cyan-500 transition-colors" size={20} />
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e) => updateField('zipCode', e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-foreground/10 bg-background-card text-foreground focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-base"
            placeholder="400001"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-between items-center">
        <button
          onClick={onPrev}
          className="flex items-center space-x-2 text-foreground-muted hover:text-foreground font-semibold transition-colors group"
        >
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={18} />
          <span>Back</span>
        </button>
        <button
          disabled={!isComplete}
          onClick={onNext}
          className="flex items-center space-x-2 bg-foreground text-background py-3.5 px-8 rounded-xl font-bold hover:bg-foreground/90 transition-all disabled:opacity-50 disabled:grayscale group shadow-lg"
        >
          <span>Continue</span>
          <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
        </button>
      </div>
    </motion.div>
  );
}
