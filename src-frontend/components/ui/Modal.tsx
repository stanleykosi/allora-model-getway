import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-[90%] sm:w-full max-w-xs sm:max-w-lg rounded-lg border border-surface bg-background p-4 sm:p-6 shadow-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 sm:mt-4">
          {children}
        </div>
      </div>
    </div>
  );
} 