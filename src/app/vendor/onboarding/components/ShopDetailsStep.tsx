'use client';

import { Store, Hash, Tag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormDropdown } from './FormDropdown';
import { CATEGORIES } from '../constants';

import { OnboardingData } from '../hooks/useOnboardingForm';

interface ShopDetailsStepProps {
  formData: OnboardingData;
  updateField: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
  onNext: () => void;
}

export function ShopDetailsStep({ formData, updateField, onNext }: ShopDetailsStepProps) {
  const isComplete = formData.name && formData.category && formData.shopNumber;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 ml-1">Store Name</label>
        <div className="relative group">
          <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted group-focus-within:text-cyan-500 transition-colors" size={20} />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-foreground/10 bg-background-card text-foreground focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-base"
            placeholder="e.g. Apollo Hospital Clinic"
            autoFocus
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 ml-1">Shop Number / identifier</label>
        <div className="relative group">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted group-focus-within:text-cyan-500 transition-colors" size={20} />
          <input
            type="text"
            value={formData.shopNumber}
            onChange={(e) => updateField('shopNumber', e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-foreground/10 bg-background-card text-foreground focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-base"
            placeholder="e.g. Shop #24 or Ground Floor"
          />
        </div>
        <p className="text-xs text-foreground-muted font-medium ml-1">Helps customers distinguish between shops with similar names.</p>
      </div>

      <FormDropdown
        label="Shop Category"
        options={CATEGORIES}
        value={formData.category}
        onChange={(val) => updateField('category', val)}
        icon={<Tag size={20} />}
        placeholder="Select your business type"
      />

      <div className="pt-4 flex justify-end">
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
