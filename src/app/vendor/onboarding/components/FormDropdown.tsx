'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export function FormDropdown({ label, options, value, onChange, placeholder = 'Select an option', icon }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 ml-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left bg-background-card ${
            isOpen ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-foreground/10'
          }`}
        >
          <div className="flex items-center space-x-3">
            {icon && <span className="text-foreground-muted">{icon}</span>}
            <span className={value ? 'text-foreground' : 'text-foreground-muted'}>
              {value || placeholder}
            </span>
          </div>
          <ChevronDown className={`text-foreground-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={18} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute z-50 w-full mt-1 bg-background-card border border-foreground/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      value === option 
                        ? 'bg-cyan-500/10 text-cyan-500' 
                        : 'text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    <span>{option}</span>
                    {value === option && <Check size={16} />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
