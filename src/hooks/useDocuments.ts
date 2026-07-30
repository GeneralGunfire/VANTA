import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';

export type DocumentCategory = 'Receipt' | 'Invoice' | 'Other';

export interface VaultDocument {
  id: string;
  anon_id: string;
  storage_path: string;
  filename: string;
  category: DocumentCategory | null;
  uploaded_at: string;
}

const BUCKET = 'documents';

interface UseDocumentsResult {
  documents: VaultDocument[];
  isLoading: boolean;
  loadError: string | null;
  isUploading: boolean;
  uploadDocument: (file: File, category: DocumentCategory | null) => Promise<void>;
  removeDocument: (doc: VaultDocument) => Promise<void>;
  getDownloadUrl: (doc: VaultDocument) => Promise<string>;
}

/**
 * Real Supabase Storage + metadata table only, same discipline as
 * useTransactions.ts / useDebts.ts / useInventory.ts. Objects live at
 * `{anon_id}/{timestamp}-{filename}` in the `documents` bucket (private —
 * every URL is a short-lived signed URL, never the public bucket URL).
 */
export function useDocuments(): UseDocumentsResult {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        if (!supabase) throw new Error('Supabase is not configured — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');

        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('anon_id', getAnonId())
          .order('uploaded_at', { ascending: false })
          .limit(500);

        if (error) throw error;
        setDocuments((data ?? []) as VaultDocument[]);
      } catch (err: any) {
        console.error('Error fetching documents:', err);
        setLoadError(err?.message ?? String(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  const uploadDocument = async (file: File, category: DocumentCategory | null) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    setIsUploading(true);
    try {
      const anonId = getAnonId();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${anonId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file);
      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('documents')
        .insert({
          anon_id: anonId,
          storage_path: storagePath,
          filename: file.name,
          category,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setDocuments((prev) => [data as VaultDocument, ...prev]);
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = async (doc: VaultDocument) => {
    if (!supabase) return;
    const prev = documents;
    setDocuments((p) => p.filter((d) => d.id !== doc.id));

    try {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([doc.storage_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id);
      if (dbError) throw dbError;
    } catch (err) {
      setDocuments(prev);
      throw err;
    }
  };

  const getDownloadUrl = async (doc: VaultDocument): Promise<string> => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60);
    if (error) throw error;
    return data.signedUrl;
  };

  return { documents, isLoading, loadError, isUploading, uploadDocument, removeDocument, getDownloadUrl };
}
