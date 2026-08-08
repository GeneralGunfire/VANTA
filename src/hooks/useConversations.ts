import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';

export interface ConversationSummary {
  id: string;
  title: string;
  updated_at: string;
}

interface UseConversationsResult {
  conversations: ConversationSummary[];
  isLoading: boolean;
  loadError: string | null;
  /** Creates a new conversation row, returns its id. */
  createConversation: (title: string, messages: unknown[]) => Promise<string>;
  /** Overwrites a conversation's message thread (called after every exchange). */
  saveConversation: (id: string, messages: unknown[]) => Promise<void>;
  /** Fetches one conversation's full message thread (not included in the list query, which stays lightweight). */
  loadConversation: (id: string) => Promise<unknown[] | null>;
  /** Soft-deletes a conversation — optimistic, rolls back on failure. */
  deleteConversation: (id: string) => Promise<void>;
}

const RECENTS_LIMIT = 12;

/**
 * Same shape as useDebts/useTransactions. The list query only selects
 * id/title/updated_at — cheap enough to load for the sidebar on every
 * page. Full message threads are fetched on demand via loadConversation,
 * only when a specific past conversation is opened.
 */
export function useConversations(): UseConversationsResult {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      try {
        if (!supabase) throw new Error('Supabase is not configured — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');

        const { data, error } = await supabase
          .from('conversations')
          .select('id, title, updated_at')
          .eq('anon_id', getAnonId())
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(RECENTS_LIMIT);

        if (error) throw error;
        setConversations((data ?? []) as ConversationSummary[]);
      } catch (err: any) {
        console.error('Error fetching conversations:', err);
        setLoadError(err?.message ?? String(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversations();
  }, []);

  const createConversation: UseConversationsResult['createConversation'] = async (title, messages) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const anon_id = getAnonId();
    const { data, error } = await supabase
      .from('conversations')
      .insert({ anon_id, title, messages })
      .select('id, title, updated_at')
      .single();

    if (error) throw error;
    const row = data as ConversationSummary;
    setConversations((prev) => [row, ...prev].slice(0, RECENTS_LIMIT));
    return row.id;
  };

  const saveConversation: UseConversationsResult['saveConversation'] = async (id, messages) => {
    if (!supabase) return;
    const updated_at = new Date().toISOString();
    const { error } = await supabase.from('conversations').update({ messages, updated_at }).eq('id', id);
    if (error) {
      console.error('Error saving conversation:', error);
      return;
    }
    // Bump the saved conversation to the top of Recents, like every other chat app does.
    setConversations((prev) => {
      const match = prev.find((c) => c.id === id);
      if (!match) return prev;
      return [{ ...match, updated_at }, ...prev.filter((c) => c.id !== id)];
    });
  };

  const loadConversation: UseConversationsResult['loadConversation'] = async (id) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from('conversations').select('messages').eq('id', id).maybeSingle();
    if (error) {
      console.error('Error loading conversation:', error);
      return null;
    }
    return (data?.messages as unknown[]) ?? null;
  };

  const deleteConversation = async (id: string) => {
    const prev = conversations;
    setConversations((p) => p.filter((c) => c.id !== id));

    if (!supabase) return;
    const { error } = await supabase.from('conversations').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      console.error('Error deleting conversation:', error);
      setConversations(prev);
      throw error;
    }
  };

  return { conversations, isLoading, loadError, createConversation, saveConversation, loadConversation, deleteConversation };
}
