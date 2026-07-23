import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Lock, Key, Cpu, UserCheck, Activity, CheckCircle2 } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityModal({ isOpen, onClose }: SecurityModalProps) {
  const [activeTab, setActiveTab] = useState<'encryption' | 'access' | 'audit'>('encryption');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white border border-vanta-border shadow-2xl rounded-sm w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-vanta-border bg-vanta-sidebar">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-vanta-navy text-white flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-vanta-navy">Security & Compliance</h3>
                <p className="text-[10px] uppercase tracking-widest text-vanta-gray">FIPS 140-2 Hardware Security Console</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-vanta-gray hover:text-vanta-navy p-1 transition-colors rounded-sm"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sub-nav tabs */}
          <div className="flex border-b border-vanta-border px-6 bg-white gap-6">
            <button
              onClick={() => setActiveTab('encryption')}
              className={`py-3 text-xs font-semibold uppercase tracking-widest transition-colors relative ${
                activeTab === 'encryption' ? 'text-vanta-navy' : 'text-vanta-gray hover:text-vanta-navy'
              }`}
            >
              Encryption & HSM
              {activeTab === 'encryption' && (
                <motion.div layoutId="secTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-vanta-navy" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`py-3 text-xs font-semibold uppercase tracking-widest transition-colors relative ${
                activeTab === 'access' ? 'text-vanta-navy' : 'text-vanta-gray hover:text-vanta-navy'
              }`}
            >
              Access Control
              {activeTab === 'access' && (
                <motion.div layoutId="secTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-vanta-navy" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 text-xs font-semibold uppercase tracking-widest transition-colors relative ${
                activeTab === 'audit' ? 'text-vanta-navy' : 'text-vanta-gray hover:text-vanta-navy'
              }`}
            >
              Audit Trail
              {activeTab === 'audit' && (
                <motion.div layoutId="secTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-vanta-navy" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {activeTab === 'encryption' && (
              <div className="space-y-4">
                <div className="p-4 bg-vanta-sidebar border border-vanta-border rounded-sm flex items-start gap-3">
                  <CheckCircle2 className="text-vanta-navy mt-0.5 shrink-0" size={18} />
                  <div>
                    <div className="text-sm font-semibold text-vanta-navy">FIPS 140-2 Level 3 Active</div>
                    <div className="text-xs text-vanta-gray leading-relaxed mt-0.5">
                      All transaction payloads are encrypted at rest using AES-256-GCM and signed with institutional private keys.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-vanta-border rounded-sm bg-vanta-bg">
                    <div className="flex items-center gap-2 text-xs font-semibold text-vanta-navy uppercase tracking-widest mb-2">
                      <Lock size={14} /> Transport Security
                    </div>
                    <div className="text-sm font-medium text-vanta-navy">TLS 1.3 Strict</div>
                    <div className="text-[10px] text-vanta-gray uppercase tracking-widest mt-1">Perfect Forward Secrecy</div>
                  </div>

                  <div className="p-4 border border-vanta-border rounded-sm bg-vanta-bg">
                    <div className="flex items-center gap-2 text-xs font-semibold text-vanta-navy uppercase tracking-widest mb-2">
                      <Cpu size={14} /> Key Management
                    </div>
                    <div className="text-sm font-medium text-vanta-navy">AWS KMS / Supabase Vault</div>
                    <div className="text-[10px] text-vanta-gray uppercase tracking-widest mt-1">Automated 90-Day Rotation</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'access' && (
              <div className="space-y-4">
                <div className="p-4 border border-vanta-border rounded-sm bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-vanta-navy">
                      <UserCheck size={16} /> Two-Factor Authentication (Simulated OTP)
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest bg-vanta-sidebar text-vanta-navy px-2 py-0.5 border border-vanta-border rounded-sm">
                      ENFORCED
                    </span>
                  </div>
                  <div className="text-xs text-vanta-gray leading-relaxed">
                    Access requires verified 6-digit OTP codes sent via institutional SMS gateway.
                  </div>
                </div>

                <div className="p-4 border border-vanta-border rounded-sm bg-white space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium text-vanta-navy">
                    <span>Active Session Timeout</span>
                    <span className="font-mono text-xs">15 Minutes</span>
                  </div>
                  <div className="text-xs text-vanta-gray">
                    Inactivity automatically terminates local tokens and prompts for re-authentication.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray font-semibold mb-2">
                  Recent Cryptographic Events
                </div>
                <div className="font-mono text-xs space-y-2">
                  <div className="p-3 bg-vanta-bg border border-vanta-border rounded-sm flex justify-between items-center">
                    <div>
                      <span className="text-vanta-navy font-semibold">[09:14:02 SAST]</span> AUTHENTICATED_SESSION_INIT
                    </div>
                    <span className="text-[10px] text-vanta-navy font-sans font-semibold">SUCCESS</span>
                  </div>
                  <div className="p-3 bg-vanta-bg border border-vanta-border rounded-sm flex justify-between items-center">
                    <div>
                      <span className="text-vanta-navy font-semibold">[09:10:45 SAST]</span> EDGE_FUNC_PARSE_TRANSACTION
                    </div>
                    <span className="text-[10px] text-vanta-navy font-sans font-semibold">SIGNED</span>
                  </div>
                  <div className="p-3 bg-vanta-bg border border-vanta-border rounded-sm flex justify-between items-center">
                    <div>
                      <span className="text-vanta-navy font-semibold">[08:45:11 SAST]</span> LEDGER_READ_SUPABASE_TRANSACTIONS
                    </div>
                    <span className="text-[10px] text-vanta-navy font-sans font-semibold">OK</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-vanta-sidebar border-t border-vanta-border flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-vanta-gray">
              <Activity size={14} className="text-vanta-navy" />
              <span>Compliance Status: Verified</span>
            </div>
            <button
              onClick={onClose}
              className="bg-vanta-navy text-white px-5 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-opacity-90 transition-opacity rounded-sm"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
