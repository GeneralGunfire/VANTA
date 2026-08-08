import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Upload, AlertTriangle, ArrowRight, ArrowUpRight, ArrowDownLeft, Send, Repeat, X, Mic, Square, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { findLikelyRecurringMatch } from '../lib/recurringMatch';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import * as XLSX from 'xlsx';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';
import { cn } from '../lib/utils';
import { SHADOW_MD } from '../lib/surfaces';
import type { AppShellContext } from '../layouts/AppLayout';
import { useTransactions } from '../hooks/useTransactions';
import { useConversations } from '../hooks/useConversations';
import { weeklyTotals } from '../lib/brief';
import { QuickActions } from '../components/dashboard/QuickActions';
import TransactionDetailModal, { Transaction } from '../components/TransactionDetailModal';
import { VantaLogo } from '../components/VantaLogo';

interface ParsedTransaction {
  id?: string;
  raw_input?: string;
  source?: 'text' | 'excel';
  amount: number | null;
  direction: 'in' | 'out' | null;
  category: string;
  description: string | null;
  confidence: number;
  needs_review: boolean;
}

type Message =
  | { id: string; role: 'user'; content: string; timestamp: string }
  | { id: string; role: 'assistant'; content: string; timestamp: string; transactions?: ParsedTransaction[] }
  | { id: string; role: 'error'; content: string; timestamp: string };

/** Omit that distributes over a union instead of collapsing it to the common shape. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Tell me about a sale or expense in your own words — for example \"sold 20 loaves R400 cash\" — and I'll add it to your books.",
  timestamp: '',
};

const COMPOSER_MAX_HEIGHT = 160;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const { transactions, isLoading: dashboardLoading, deleteTransaction } = useTransactions();
  const params = useParams<{ conversationId?: string }>();
  const { createConversation, saveConversation, loadConversation } = useConversations();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(params.conversationId ?? null);
  const hydratingRef = useRef(false);
  const lastHydratedIdRef = useRef<string | null>(null);
  const creatingRef = useRef(false);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const [recurringPromptDismissed, setRecurringPromptDismissed] = useState<Record<string, boolean>>({});
  const [recurringConfirmed, setRecurringConfirmed] = useState<Record<string, boolean>>({});
  const [reviewConfirmed, setReviewConfirmed] = useState<Record<string, boolean>>({});
  const [confirmingReviewKey, setConfirmingReviewKey] = useState<string | null>(null);
  const [undoneKeys, setUndoneKeys] = useState<Record<string, boolean>>({});
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const recorder = useAudioRecorder();
  const [micError, setMicError] = useState<string | null>(null);

  // Collapses the sidebar while the composer is active. Blurring restores it,
  // so the nav is always one click (or Escape) away.
  const { setComposerFocused } = useOutletContext<AppShellContext>();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Grows the composer naturally as the owner types, capped so a long
  // paste never turns it into most of the screen.
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
  }, [input]);

  // Leaving focus mode should never require hunting for somewhere safe to click.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') composerRef.current?.blur();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // A route change while focused would otherwise strand the sidebar collapsed.
  useEffect(() => () => setComposerFocused(false), [setComposerFocused]);

  useEffect(() => {
    if (micError) {
      toast.error(micError);
      setMicError(null);
    }
  }, [micError]);

  // Recording holds an open microphone stream — release it if the owner
  // navigates away mid-recording rather than leaving the mic hot.
  useEffect(() => () => recorder.cancelRecording(), []);

  // A future entry point (e.g. a "try this" link) can hand a phrase over via
  // router state. Load it into the composer (never auto-send — the owner
  // must confirm) and clear the state so a refresh doesn't re-apply it.
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const prefill = (location.state as { prefill?: string } | null)?.prefill;
    if (!prefill) return;
    setInput(prefill);
    composerRef.current?.focus();
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  // Loads a past conversation when the URL names one (clicked from
  // Recents), or resets to a fresh chat when it doesn't (e.g. clicking
  // Home again). Skipped when the id already matches what's loaded — true
  // right after this same page creates a conversation and updates its own
  // URL, so that doesn't trigger a redundant refetch.
  useEffect(() => {
    const id = params.conversationId ?? null;
    if (id === lastHydratedIdRef.current) return;
    lastHydratedIdRef.current = id;
    setActiveConversationId(id);

    if (!id) {
      setMessages([WELCOME]);
      return;
    }

    let cancelled = false;
    hydratingRef.current = true;
    loadConversation(id).then((loaded) => {
      if (cancelled) return;
      setMessages((loaded && loaded.length > 0 ? (loaded as Message[]) : [WELCOME]));
      hydratingRef.current = false;
    });
    return () => {
      cancelled = true;
    };
  }, [params.conversationId, loadConversation]);

  // Persists the thread after every real exchange — a conversation is
  // created lazily on the first exchange (never on the empty welcome
  // state), then just updated in place after that. Skipped while a past
  // conversation is still being loaded, so hydration never re-saves
  // what it just read.
  useEffect(() => {
    if (hydratingRef.current) return;
    if (messages.length <= 1) return;

    if (!activeConversationId) {
      // The assistant's reply can land before this resolves — without this
      // guard, that second messages change would fire a second create and
      // produce two rows for one conversation.
      if (creatingRef.current) return;
      creatingRef.current = true;
      const firstUserMsg = messages.find((m) => m.role === 'user');
      const title = (firstUserMsg?.content ?? 'New conversation').slice(0, 60);
      createConversation(title, messages).then((id) => {
        lastHydratedIdRef.current = id;
        setActiveConversationId(id);
        navigate(`/app/chat/${id}`, { replace: true });
        // Catches up on any reply that arrived while the create request
        // was in flight — messagesRef always holds the latest value, so
        // this is a no-op write if nothing changed since `messages` above.
        if (messagesRef.current !== messages) saveConversation(id, messagesRef.current);
      });
    } else {
      saveConversation(activeConversationId, messages);
    }
  }, [messages]);

  function addMessage(msg: DistributiveOmit<Message, 'id' | 'timestamp'> & { id?: string }) {
    const timeStr = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { ...msg, id: msg.id ?? Date.now().toString(), timestamp: timeStr }]);
  }

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
    composerRef.current?.focus();
  };

  /**
   * Shared by both the text composer and the file-upload path — both end
   * up calling parse-transaction with a single raw_input string (which may
   * describe multiple transactions; the edge function's prompt already
   * handles splitting a multi-line/multi-sentence input into several rows).
   * The only difference is `source` and the user-facing label for the
   * message bubble.
   */
  const submitToParser = async (rawInput: string, source: 'text' | 'excel', userLabel: string) => {
    addMessage({ role: 'user', content: userLabel });
    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
      }

      // Real parse-transaction contract: { raw_input, source }, returns
      // { transactions: [...] } (always an array, one item per parsed
      // transaction — a single free-text message can yield several rows
      // when it describes multiple transactions at once).
      const { data, error } = await supabase.functions.invoke('parse-transaction', {
        body: { raw_input: rawInput, source },
        headers: { 'x-vanta-anon-id': getAnonId() },
      });

      if (error) throw error;

      const parsedTransactions: ParsedTransaction[] = Array.isArray(data?.transactions) ? data.transactions : [];

      if (parsedTransactions.length === 0) {
        addMessage({ role: 'error', content: "Something went wrong — no transaction came back from that. Try rephrasing it." });
      } else {
        addMessage({
          role: 'assistant',
          content:
            parsedTransactions.length === 1
              ? "Got it — here's what I recorded."
              : `Got it — I found ${parsedTransactions.length} separate transactions in that.`,
          transactions: parsedTransactions,
        });
      }
    } catch (err: any) {
      console.error('Error parsing transaction:', err);
      // Honest failure — never invent a transaction to show in its place.
      addMessage({ role: 'error', content: `I couldn't make sense of that: ${err?.message ?? String(err)}` });
    } finally {
      setIsLoading(false);
    }
  };

  const submitCurrentInput = async () => {
    if (!input.trim() || isLoading) return;
    const currentQuery = input;
    setInput('');
    await submitToParser(currentQuery, 'text', currentQuery);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCurrentInput();
  };

  // Enter sends; Shift+Enter inserts a newline, same convention as every
  // chat composer — only meaningful now that the field can grow past one line.
  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitCurrentInput();
    }
  };

  const MAX_EXCEL_ROWS = 50;

  /**
   * Converts every non-empty row of the first sheet into one plain-text
   * line (column values joined with spaces), then submits the whole file
   * as a single raw_input — parse-transaction's existing multi-transaction
   * detection in its prompt does the actual per-row splitting/extraction,
   * exactly the same "bulk paste" path already supported for pasted text.
   * Capped at MAX_EXCEL_ROWS lines to keep the prompt a reasonable size;
   * anything beyond that is silently truncated and the user is told so.
   */
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error('No sheet found in that file.');

      const sheet = workbook.Sheets[firstSheetName];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

      const lines = rows
        .map((row) => row.map((cell) => String(cell ?? '').trim()).filter(Boolean).join(' '))
        .filter((line) => line.length > 0)
        .slice(0, MAX_EXCEL_ROWS);

      if (lines.length === 0) throw new Error('No usable rows found in that file.');

      const rawInput = lines.join('\n');
      const truncatedNote = rows.length > MAX_EXCEL_ROWS ? ` (first ${MAX_EXCEL_ROWS} rows only)` : '';
      await submitToParser(rawInput, 'excel', `Uploaded file: ${file.name}${truncatedNote}`);
    } catch (err: any) {
      console.error('Error reading uploaded file:', err);
      addMessage({ role: 'error', content: `Couldn't read "${file.name}": ${err?.message ?? String(err)}` });
      setIsLoading(false);
    }
  };

  /**
   * Tap to start, tap again to stop — no separate stop control needed
   * since the button itself swaps icon/state. On stop, the clip is sent
   * to transcribe-audio and the result lands in the composer text input
   * for the owner to review/edit, exactly like typed text — never
   * auto-submitted as a transaction, since a mis-transcription should get
   * the same chance to be caught before it's parsed.
   */
  const handleMicClick = async () => {
    setMicError(null);

    if (recorder.status === 'recording') {
      const blob = await recorder.stopRecording();
      if (!blob) {
        recorder.reset();
        return;
      }

      try {
        if (!supabase) throw new Error('Supabase is not configured.');

        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: formData,
          headers: { 'x-vanta-anon-id': getAnonId() },
        });

        if (error) throw error;
        if (data?.error || !data?.text) {
          throw new Error(data?.error ?? "Couldn't hear that — try again or type it instead.");
        }

        setInput((prev) => (prev.trim() ? `${prev.trim()} ${data.text}` : data.text));
        composerRef.current?.focus();
      } catch (err: any) {
        console.error('Transcription failed:', err);
        setMicError(err?.message ?? "Couldn't hear that — try again or type it instead.");
      } finally {
        recorder.reset();
      }
      return;
    }

    try {
      await recorder.startRecording();
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setMicError(
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? "Vanta needs microphone access to record — check your browser's permission settings and try again."
          : (err?.message ?? "Couldn't access your microphone — try again or type it instead."),
      );
    }
  };

  const handleMarkRecurring = async (item: ParsedTransaction, key: string) => {
    if (!item.id || !supabase) return;
    try {
      const { error } = await supabase.from('transactions').update({ is_recurring: true }).eq('id', item.id);
      if (error) throw error;
      setRecurringConfirmed((prev) => ({ ...prev, [key]: true }));
      toast.success('Marked as recurring');
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not save — try again.');
    }
  };

  /** "Is that right?" → yes. A real write, not just a local dismissal — the record itself stops needing review. */
  const handleConfirmReview = async (item: ParsedTransaction, key: string) => {
    if (!item.id || !supabase) return;
    setConfirmingReviewKey(key);
    try {
      const { error } = await supabase.from('transactions').update({ needs_review: false }).eq('id', item.id);
      if (error) throw error;
      setReviewConfirmed((prev) => ({ ...prev, [key]: true }));
      toast.success("Got it — marked as confirmed.");
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not save — try again.');
    } finally {
      setConfirmingReviewKey(null);
    }
  };

  /** Undo reuses the same soft-delete every other "remove this entry" control in the app already calls — nothing new on the backend. */
  const handleUndo = async (item: ParsedTransaction, key: string) => {
    if (!item.id) return;
    try {
      await deleteTransaction(item.id);
      setUndoneKeys((prev) => ({ ...prev, [key]: true }));
      toast.success('Removed');
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not undo — try again.');
    }
  };

  const renderTransactionCards = (items: ParsedTransaction[]) => (
    <div className="mt-3 space-y-3">
      {items.map((item, idx) => {
        const cardKey = item.id ?? String(idx);

        if (item.needs_review) {
          const isConfirmed = reviewConfirmed[cardKey];
          return (
            <motion.div
              key={cardKey}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="border-t border-vanta-border pt-3 space-y-2.5"
            >
              <p className="text-[13px] font-medium text-vanta-black flex items-center gap-1.5">
                <AlertTriangle size={13} className="shrink-0 text-vanta-warning" />
                {isConfirmed ? 'Confirmed.' : "I'm not fully sure about this one."}
              </p>

              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[14px]">
                {item.amount !== null && (
                  <span className="text-vanta-black">
                    Best guess <span className="font-mono font-medium">R{item.amount.toFixed(2)}</span>
                  </span>
                )}
                <span className="text-vanta-black">
                  Category <span className="font-medium">{item.category}</span>
                </span>
              </div>

              {!isConfirmed ? (
                <div className="flex items-center gap-4 pt-0.5">
                  <span className="text-[13px] text-vanta-gray">Is that right?</span>
                  <button
                    onClick={() => handleConfirmReview(item, cardKey)}
                    disabled={confirmingReviewKey === cardKey}
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-vanta-navy hover:text-vanta-navy-dark transition-colors disabled:opacity-50"
                  >
                    <Check size={13} />
                    {confirmingReviewKey === cardKey ? 'Saving…' : 'Yes'}
                  </button>
                  <Link to="/app/ledger" className="text-[13px] font-medium text-vanta-gray hover:text-vanta-black transition-colors">
                    Fix it
                  </Link>
                </div>
              ) : (
                <div className="text-[13px] text-vanta-success font-medium">Confirmed</div>
              )}
            </motion.div>
          );
        }

        if (undoneKeys[cardKey]) {
          return (
            <div key={cardKey} className="border-t border-vanta-border pt-3 text-[13px] text-vanta-gray-light italic">
              Removed.
            </div>
          );
        }

        const recurringMatch = !recurringPromptDismissed[cardKey] && !recurringConfirmed[cardKey]
          ? findLikelyRecurringMatch(item, transactions)
          : null;

        return (
          <div key={cardKey} className="border-t border-vanta-border pt-3 space-y-2.5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[14px] text-vanta-black">{item.category}</span>
              <span className="font-mono text-[14px] font-medium text-vanta-black flex items-center gap-1 shrink-0">
                {item.direction === 'in' ? <ArrowDownLeft size={13} className="text-vanta-success" /> : <ArrowUpRight size={13} className="text-vanta-gray" />}
                {item.direction === 'in' ? '+' : '-'}R{(item.amount ?? 0).toFixed(2)}
              </span>
            </div>
            {item.description && <p className="text-[13px] text-vanta-gray">{item.description}</p>}

            <div className="flex items-center gap-4 pt-0.5">
              <button onClick={() => handleUndo(item, cardKey)} className="text-[13px] font-medium text-vanta-gray hover:text-vanta-black transition-colors">
                Undo
              </button>
              <Link to="/app/ledger" className="text-[13px] font-medium text-vanta-navy hover:text-vanta-navy-dark transition-colors">
                View entry
              </Link>
            </div>

            {recurringConfirmed[cardKey] && (
              <div className="flex items-center gap-1.5 text-[12px] text-vanta-gray-light">
                <Repeat size={11} />
                Marked as recurring
              </div>
            )}

            {recurringMatch && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[12px] text-vanta-gray-light leading-snug flex items-center gap-1.5">
                  <Repeat size={11} className="shrink-0" />
                  Looks like "{recurringMatch.description || recurringMatch.raw_input}" — mark as recurring?
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleMarkRecurring(item, cardKey)}
                    className="text-[12px] font-medium text-vanta-navy hover:text-vanta-navy-dark"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setRecurringPromptDismissed((prev) => ({ ...prev, [cardKey]: true }))}
                    aria-label="Dismiss"
                    className="p-0.5 text-vanta-gray-light hover:text-vanta-gray"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const isEmpty = messages.length === 1 && messages[0].id === 'welcome';

  // One real sentence, not a stat — a teaser toward the full Vanta Brief,
  // never a duplicate of it. Says nothing at all rather than a hollow "R0"
  // line when there's no confirmed activity yet this month.
  const glanceMonth = weeklyTotals(transactions, 30);
  const glanceLine = !glanceMonth.hasActivity
    ? null
    : glanceMonth.net > 0
      ? `You made R${Math.round(glanceMonth.net).toLocaleString('en-ZA')} more than you spent this month.`
      : glanceMonth.net < 0
        ? `You spent R${Math.round(Math.abs(glanceMonth.net)).toLocaleString('en-ZA')} more than you made this month.`
        : "You've broken even this month — money in matched money out.";

  const composer = (
    <form onSubmit={handleSubmit} className="group relative">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = '';
        }}
      />

      <div
        className="rounded-[20px] border border-vanta-border bg-white transition-colors duration-150 group-focus-within:border-vanta-navy/40"
        style={{ boxShadow: SHADOW_MD }}
      >
        <textarea
          ref={composerRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleComposerKeyDown}
          onFocus={() => setComposerFocused(true)}
          onBlur={() => setComposerFocused(false)}
          placeholder={
            recorder.status === 'recording'
              ? 'Recording… tap the mic again to stop'
              : recorder.status === 'transcribing'
                ? 'Transcribing…'
                : 'Tell Vanta what happened…'
          }
          disabled={recorder.status === 'transcribing'}
          className="w-full resize-none bg-transparent px-5 pt-4 pb-1 text-vanta-black placeholder-vanta-gray-light focus:outline-none text-[15px] leading-relaxed disabled:cursor-wait"
        />
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach an Excel or CSV file"
              className="p-2 text-vanta-gray-light hover:text-vanta-black transition-colors duration-150 rounded-lg hover:bg-muted"
            >
              <Upload size={16} />
            </button>
            {recorder.isSupported && (
              <button
                type="button"
                onClick={handleMicClick}
                disabled={recorder.status === 'transcribing'}
                title={recorder.status === 'recording' ? 'Stop recording' : 'Record a voice message'}
                className={cn(
                  'p-2 rounded-lg transition-colors duration-150 disabled:opacity-40',
                  recorder.status === 'recording'
                    ? 'text-vanta-navy bg-vanta-accent-tint'
                    : 'text-vanta-gray-light hover:text-vanta-black hover:bg-muted',
                )}
              >
                {recorder.status === 'recording' ? <Square size={15} /> : <Mic size={16} />}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!input && (
              <span className="text-[11px] font-mono text-vanta-gray-light hidden sm:inline-block">Enter to send</span>
            )}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              title="Send"
              className="w-8 h-8 rounded-full bg-vanta-navy text-white flex items-center justify-center transition-all duration-150 disabled:opacity-30 hover:bg-vanta-navy-dark active:scale-95"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </form>
  );

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto overflow-x-hidden">
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onDelete={(tx) => deleteTransaction(tx.id)}
        />

        {/* A calm, spacious canvas — no dashboard tiles, no charts, nothing to
            read before the owner has said anything. The composer is the point. */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 min-h-full">
          <div className="w-full max-w-170 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mb-6"
            >
              <VantaLogo size={40} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.04 }}>
              <h1 className="text-[36px] md:text-[44px] font-semibold leading-[1.15] mb-3 text-vanta-black text-balance">
                What happened in your business today?
              </h1>
              <p className="text-[15px] text-vanta-gray mb-9">
                Tell Vanta what happened and I'll take care of the books.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="w-full">
              {composer}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }} className="w-full mt-5 flex flex-col items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.08em] text-vanta-gray-light font-medium">Try</span>
              <QuickActions onSelect={handleQuickPrompt} />
            </motion.div>

            {glanceLine && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.24 }}
                className="mt-9"
              >
                <div className="text-[11px] uppercase tracking-[0.08em] text-vanta-gray-light font-medium mb-2">
                  Your business at a glance
                </div>
                <Link
                  to="/app/brief"
                  className="group inline-flex items-center gap-2 text-vanta-black hover:text-vanta-navy transition-colors"
                >
                  <span className="text-[15px] leading-relaxed">{glanceLine}</span>
                  <ArrowRight size={14} className="shrink-0 text-vanta-gray-light group-hover:text-vanta-navy group-hover:translate-x-0.5 transition-all" />
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} onDelete={(tx) => deleteTransaction(tx.id)} />
      <div className="relative flex-1 overflow-y-auto px-6 pt-8 pb-44">
        <div className="max-w-2xl mx-auto space-y-7">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={cn('flex flex-col gap-1', msg.role === 'user' ? 'items-end' : 'items-start')}
            >
              {msg.role === 'user' && (
                <>
                  <span className="text-[11px] font-medium text-vanta-gray-light">You</span>
                  <p className="text-[15px] text-vanta-black leading-relaxed max-w-xl text-right">{msg.content}</p>
                </>
              )}

              {msg.role === 'error' && (
                <div className="w-full max-w-xl">
                  <span className="text-[11px] font-medium text-vanta-gray-light">Vanta</span>
                  <p className="text-[15px] text-vanta-black leading-relaxed mt-1 flex items-start gap-1.5">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5 text-vanta-warning" />
                    {msg.content}
                  </p>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="w-full max-w-xl">
                  <span className="text-[11px] font-medium text-vanta-gray-light">Vanta</span>
                  <p className="text-[15px] text-vanta-black leading-relaxed mt-1">{msg.content}</p>
                  {msg.transactions && renderTransactionCards(msg.transactions)}
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-[13px] text-vanta-gray-light">
              <Loader2 size={13} className="animate-spin" />
              Thinking…
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-30">
        <div className="max-w-2xl mx-auto space-y-2.5">
          {composer}
          <QuickActions onSelect={handleQuickPrompt} />
        </div>
      </div>
    </div>
  );
}
