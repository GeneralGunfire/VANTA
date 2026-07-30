import { useRef, useState } from 'react';
import { Upload, AlertTriangle, Download, Trash2, FolderLock } from 'lucide-react';
import { toast } from 'sonner';
import { useDocuments, type DocumentCategory, type VaultDocument } from '../hooks/useDocuments';
import { cn } from '../lib/utils';

const CATEGORIES: { value: DocumentCategory | null; label: string }[] = [
  { value: null, label: 'Uncategorized' },
  { value: 'Receipt', label: 'Receipt' },
  { value: 'Invoice', label: 'Invoice' },
  { value: 'Other', label: 'Other' },
];

/**
 * Storage/retrieval only — no OCR, no automatic linking of documents to
 * transactions. See final report for why that's intentionally out of scope
 * tonight.
 */
export default function DocumentsPage() {
  const { documents, isLoading, loadError, isUploading, uploadDocument, removeDocument, getDownloadUrl } = useDocuments();
  const [pendingCategory, setPendingCategory] = useState<DocumentCategory | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadDocument(file, pendingCategory);
      toast.success(`Uploaded "${file.name}"`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload failed — try again.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (doc: VaultDocument) => {
    try {
      const url = await getDownloadUrl(doc);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not open file.');
    }
  };

  const handleDelete = async (doc: VaultDocument) => {
    try {
      await removeDocument(doc);
      toast.success(`Deleted "${doc.filename}"`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not delete — try again.');
    }
  };

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-2xl font-serif text-vanta-black tracking-tight">Document Vault</h1>
            <p className="text-sm text-vanta-gray mt-1">Receipts, invoices, and business documents in one place</p>
          </div>
        </div>

        <div className="border border-vanta-border rounded-2xl bg-white p-6 space-y-4" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
          <div className="text-[10px] uppercase tracking-widest font-semibold text-vanta-black">Upload a document</div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-vanta-sidebar p-1.5 border border-vanta-border rounded-full text-xs">
              {CATEGORIES.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setPendingCategory(c.value)}
                  className={cn(
                    'px-4 py-2 font-medium transition-all rounded-full whitespace-nowrap',
                    pendingCategory === c.value
                      ? 'bg-white text-vanta-black border border-vanta-border shadow-sm'
                      : 'text-vanta-gray hover:text-vanta-black border border-transparent',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <label
              className={cn(
                'text-white px-5 py-2.5 text-xs font-semibold transition-all flex items-center gap-2 rounded-lg cursor-pointer active:scale-[0.98] shadow-[0_6px_18px_-6px_rgba(30,90,168,0.55)] hover:shadow-[0_8px_22px_-6px_rgba(30,90,168,0.65)] hover:-translate-y-0.5',
                isUploading && 'opacity-60 pointer-events-none',
              )}
              style={{ background: 'linear-gradient(155deg, #2E6EBF 0%, #1E5AA8 60%, #153F78 100%)' }}
            >
              <Upload size={16} />
              {isUploading ? 'Uploading…' : 'Choose file'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>
          <p className="text-xs text-vanta-gray">Images and PDFs only.</p>
        </div>

        <div className="border border-vanta-border rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
          {isLoading ? (
            <div className="text-center py-16 text-vanta-gray text-sm italic">Loading…</div>
          ) : loadError ? (
            <div role="alert" className="flex items-center justify-center gap-2 py-16 text-vanta-black text-sm px-6">
              <AlertTriangle size={16} />
              Couldn't load documents: {loadError}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-20 text-vanta-gray text-sm px-6 leading-relaxed flex flex-col items-center gap-3">
              <FolderLock size={20} className="text-vanta-gray-light" />
              No documents yet — upload a receipt, invoice, or other file to keep it here.
            </div>
          ) : (
            <div className="divide-y divide-vanta-border/60">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-vanta-black truncate">{doc.filename}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {doc.category && (
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-vanta-gray">{doc.category}</span>
                      )}
                      <span className="text-[10px] font-mono text-vanta-gray-light">
                        {new Date(doc.uploaded_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDownload(doc)}
                      aria-label={`Download ${doc.filename}`}
                      className="p-1.5 rounded-lg text-vanta-gray hover:text-vanta-black hover:bg-vanta-sidebar transition-colors"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      aria-label={`Delete ${doc.filename}`}
                      className="p-1.5 rounded-lg text-vanta-gray hover:text-vanta-black hover:bg-vanta-sidebar transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
