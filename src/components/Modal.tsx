import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  maxWidth?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * One consistent modal shell for the whole app — transaction detail, add
 * transaction, and any confirmation dialog all render through this. White
 * surface, near-black text, blue accent only. Dismissal is always the same:
 * click outside, the visible close button, or Escape.
 */
export default function Modal({ isOpen, onClose, title, eyebrow, icon, maxWidth = 'max-w-lg', footer, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vanta-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white border border-vanta-border shadow-2xl rounded-2xl w-full ${maxWidth} max-h-[85vh] overflow-hidden flex flex-col`}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-vanta-border bg-vanta-sidebar shrink-0">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="w-8 h-8 rounded-lg bg-vanta-navy text-white flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                )}
                <div>
                  {eyebrow && (
                    <p className="text-[10px] uppercase tracking-widest text-vanta-gray font-semibold mb-0.5">{eyebrow}</p>
                  )}
                  <h3 className="font-semibold text-lg text-vanta-black leading-tight">{title}</h3>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-vanta-gray hover:text-vanta-black p-1.5 rounded-lg hover:bg-black/5 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">{children}</div>

            {footer && (
              <div className="p-4 bg-vanta-sidebar border-t border-vanta-border flex justify-end gap-3 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
