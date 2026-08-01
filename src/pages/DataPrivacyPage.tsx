import { useState } from 'react';
import { AlertTriangle, Download, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { exportAllData } from '../lib/dataExport';
import { SHADOW_SM } from '../lib/surfaces';

/**
 * Plainly honest about what Vanta stores and its real current limitations —
 * deliberately not written in compliance/security-theater language ("bank
 * grade," "AES-256," "verified") since none of those claims would be true
 * yet. The two facts that matter most (simplified sign-in, Document Vault
 * isolation gap) are stated up front, not buried under reassurance.
 */
export default function DataPrivacyPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAllData();
      toast.success('Your data export has downloaded');
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not export — try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-vanta-black tracking-tight">Your Data & Privacy</h1>
          <p className="text-sm text-vanta-gray mt-1">What Vanta stores, and where things honestly stand today</p>
        </div>

        <div
          className="flex items-start gap-3 p-4 border-2 border-vanta-black rounded-xl bg-white text-sm text-vanta-black leading-relaxed"
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium">Two things you should know before you rely on this app for sensitive information:</p>
            <p>
              Vanta currently uses a simplified sign-in, not full bank-grade authentication — this app is still in early
              development.
            </p>
            <p>
              Documents uploaded to the Document Vault are <span className="font-semibold">not yet fully access-isolated
              between accounts</span>. Please don't upload highly sensitive documents (like ID copies or bank statements)
              until this is resolved.
            </p>
          </div>
        </div>

        <div className="border border-vanta-border rounded-2xl bg-white p-6 space-y-4" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-vanta-navy" />
            <h2 className="text-sm font-semibold text-vanta-black">What Vanta stores</h2>
          </div>
          <div className="space-y-3 text-sm text-vanta-black leading-relaxed">
            <p>
              Everything you tell Vanta in chat, or add manually, is stored so it can build your books and answer questions
              about your business. Specifically:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-vanta-gray">
              <li><span className="text-vanta-black">Transactions</span> — every sale and expense you record, including the exact words you typed.</li>
              <li><span className="text-vanta-black">Debtors & creditors</span> — who owes you money, and who you owe.</li>
              <li><span className="text-vanta-black">Invoices</span> — bills you've created for customers.</li>
              <li><span className="text-vanta-black">Inventory</span> — stock items you've added, with quantities and prices.</li>
              <li><span className="text-vanta-black">Documents</span> — any receipts, invoices, or files you've uploaded to the Document Vault.</li>
              <li><span className="text-vanta-black">Business profile</span> — your business name, type, and tax registration status.</li>
            </ul>
            <p>
              This data lives in a Supabase database and storage bucket. Vanta uses a device-based identifier to keep your
              data separate from other businesses using the app — it isn't tied to a password-protected account yet, so
              clearing your browser data or switching devices will start a new, empty business record.
            </p>
            <p>
              When you type a message in chat, it's sent to Groq (an AI provider) to be turned into a structured transaction.
              Groq processes that text but Vanta does not use it to train any model.
            </p>
          </div>
        </div>

        <div className="border border-vanta-border rounded-2xl bg-white p-6 space-y-4" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
          <div className="flex items-center gap-2">
            <Download size={16} className="text-vanta-navy" />
            <h2 className="text-sm font-semibold text-vanta-black">Download everything</h2>
          </div>
          <p className="text-sm text-vanta-gray leading-relaxed">
            Your financial history shouldn't feel trapped in this app. Download a plain-text file of everything you've
            recorded — every transaction, debtor/creditor, invoice, and inventory item — to keep for your own records or
            move elsewhere.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-vanta-navy text-white px-5 py-2.5 text-xs font-semibold transition-colors duration-150 flex items-center gap-2 rounded-lg active:scale-[0.98] hover:bg-vanta-navy/90 disabled:opacity-50"
            style={{ boxShadow: SHADOW_SM }}
          >
            <Download size={14} />
            {isExporting ? 'Preparing…' : 'Download my data'}
          </button>
        </div>

        <p className="text-xs text-vanta-gray-light leading-relaxed">
          This page will be updated as Vanta's authentication and access controls mature. If anything here changes, it will
          be reflected here honestly rather than left to go stale.
        </p>
      </div>
    </div>
  );
}
