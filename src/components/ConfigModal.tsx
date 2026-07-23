import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Database, Sliders, RefreshCw, Key, Server, FileSpreadsheet } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfigModal({ isOpen, onClose }: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'entity' | 'integration' | 'audit'>('entity');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [entityName, setEntityName] = useState('Acme Corp. (Pty) Ltd');
  const [taxRef, setTaxRef] = useState('9823410293');
  const [currency, setCurrency] = useState('ZAR');
  const [autoReconcile, setAutoReconcile] = useState(true);

  if (!isOpen) return null;

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

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
                <Sliders size={16} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-vanta-navy">System Configuration</h3>
                <p className="text-[10px] uppercase tracking-widest text-vanta-gray">Institutional Ledger Controls</p>
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
              onClick={() => setActiveTab('entity')}
              className={`py-3 text-xs font-semibold uppercase tracking-widest transition-colors relative ${
                activeTab === 'entity' ? 'text-vanta-navy' : 'text-vanta-gray hover:text-vanta-navy'
              }`}
            >
              Entity & Rules
              {activeTab === 'entity' && (
                <motion.div layoutId="configTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-vanta-navy" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className={`py-3 text-xs font-semibold uppercase tracking-widest transition-colors relative ${
                activeTab === 'integration' ? 'text-vanta-navy' : 'text-vanta-gray hover:text-vanta-navy'
              }`}
            >
              Backend & API
              {activeTab === 'integration' && (
                <motion.div layoutId="configTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-vanta-navy" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 text-xs font-semibold uppercase tracking-widest transition-colors relative ${
                activeTab === 'audit' ? 'text-vanta-navy' : 'text-vanta-gray hover:text-vanta-navy'
              }`}
            >
              Export & Backup
              {activeTab === 'audit' && (
                <motion.div layoutId="configTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-vanta-navy" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {activeTab === 'entity' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-navy mb-2">
                    Primary Entity Legal Name
                  </label>
                  <input
                    type="text"
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    className="w-full bg-vanta-bg border border-vanta-border p-3 text-sm text-vanta-navy focus:outline-none focus:border-vanta-navy rounded-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-navy mb-2">
                      SARS Tax Reference
                    </label>
                    <input
                      type="text"
                      value={taxRef}
                      onChange={(e) => setTaxRef(e.target.value)}
                      className="w-full bg-vanta-bg border border-vanta-border p-3 text-sm text-vanta-navy focus:outline-none focus:border-vanta-navy rounded-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-navy mb-2">
                      Functional Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-vanta-bg border border-vanta-border p-3 text-sm text-vanta-navy focus:outline-none focus:border-vanta-navy rounded-sm"
                    >
                      <option value="ZAR">ZAR - South African Rand</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-vanta-border flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-vanta-navy">Automated Neural Reconciliation</div>
                    <div className="text-xs text-vanta-gray">Auto-parse incoming conversational prompts into structured ledger drafts.</div>
                  </div>
                  <button
                    onClick={() => setAutoReconcile(!autoReconcile)}
                    className={`w-12 h-6 rounded-full transition-colors p-1 ${
                      autoReconcile ? 'bg-vanta-navy' : 'bg-vanta-border'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        autoReconcile ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'integration' && (
              <div className="space-y-4">
                <div className="p-4 bg-vanta-sidebar border border-vanta-border rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="text-vanta-navy" size={20} />
                    <div>
                      <div className="text-sm font-medium text-vanta-navy">Supabase Database Connection</div>
                      <div className="text-xs text-vanta-gray font-mono">Edge Function: parse-transaction</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-vanta-navy bg-vanta-sidebar px-2.5 py-1 border border-vanta-border rounded-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-vanta-navy animate-pulse" />
                    CONNECTED
                  </span>
                </div>

                <div className="p-4 bg-vanta-sidebar border border-vanta-border rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="text-vanta-navy" size={20} />
                    <div>
                      <div className="text-sm font-medium text-vanta-navy">Ledger Table Schema</div>
                      <div className="text-xs text-vanta-gray font-mono">public.transactions</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-vanta-navy bg-white px-2.5 py-1 border border-vanta-border rounded-sm">
                    READ / WRITE
                  </span>
                </div>

                <div className="p-4 border border-vanta-border rounded-sm bg-white space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-widest text-vanta-navy flex items-center gap-2">
                    <Key size={14} /> API Credentials Status
                  </div>
                  <div className="text-xs text-vanta-gray leading-relaxed">
                    Client initialized with project credentials. Requests signed via standard anon headers.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="p-4 border border-vanta-border rounded-sm bg-vanta-bg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-vanta-navy">Export Complete Transaction History</div>
                    <div className="text-xs text-vanta-gray">Download ledger entries as CSV for accounting reconciliation.</div>
                  </div>
                  <button
                    onClick={() => alert('Exporting CSV log...')}
                    className="bg-vanta-navy text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 hover:bg-opacity-90 transition-opacity rounded-sm flex items-center gap-2"
                  >
                    <FileSpreadsheet size={14} />
                    Export CSV
                  </button>
                </div>

                <div className="p-4 border border-vanta-border rounded-sm bg-vanta-bg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-vanta-navy">Flush Local Cache</div>
                    <div className="text-xs text-vanta-gray">Reset local temporary session states without touching Supabase data.</div>
                  </div>
                  <button
                    onClick={() => {
                      alert('Local state refreshed.');
                    }}
                    className="border border-vanta-border bg-white text-vanta-navy text-xs font-semibold uppercase tracking-widest px-4 py-2 hover:bg-vanta-sidebar transition-colors rounded-sm flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    Reset Cache
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-vanta-sidebar border-t border-vanta-border flex justify-between items-center">
            {savedSuccess ? (
              <span className="text-xs font-semibold text-vanta-navy flex items-center gap-1">
                <Check size={14} /> Configuration saved
              </span>
            ) : (
              <span className="text-[10px] text-vanta-gray uppercase tracking-widest">Changes applied to local workspace</span>
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-vanta-gray hover:text-vanta-navy transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                className="bg-vanta-navy text-white px-5 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-opacity-90 transition-opacity rounded-sm"
              >
                Save Settings
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
