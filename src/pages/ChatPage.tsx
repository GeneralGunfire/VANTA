import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Upload, AlertTriangle, ArrowUpRight, ArrowDownLeft, RefreshCw, Send, Repeat, X, Mic, Square } from 'lucide-react';
import { toast } from 'sonner';
import { findLikelyRecurringMatch } from '../lib/recurringMatch';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import * as XLSX from 'xlsx';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';
import { cn } from '../lib/utils';
import { SHADOW_MD, SHADOW_SM } from '../lib/surfaces';
import type { AppShellContext } from '../layouts/AppLayout';
import { useTransactions } from '../hooks/useTransactions';
import { useDebts } from '../hooks/useDebts';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import { LedgerSummary } from '../components/dashboard/LedgerSummary';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { QuickActions } from '../components/dashboard/QuickActions';
import { NudgeBar } from '../components/dashboard/NudgeBar';
import TransactionDetailModal, { Transaction } from '../components/TransactionDetailModal';
import vantaLogoMark from '../assets/vanta-logo-mark.jpeg';

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

/**
 * Prompt cards shown on the empty-state hero — same examples as
 * QuickActions (kept in one place there for the active-conversation
 * view), but rendered as cards here to match the reference template's
 * greeting + prompt-card grid.
 */
const QUICK_PROMPT_CARDS = [
  { label: 'Record a sale', example: 'sold 20 loaves, R400 cash' },
  { label: 'Record an expense', example: 'bought flour for R180' },
  { label: 'Log a deposit', example: 'deposited R2,000 cash at the bank' },
  { label: 'Ask about the week', example: "how's business this week?" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);

  const { transactions, isLoading: dashboardLoading, loadError: dashboardError, deleteTransaction } = useTransactions();
  const { debts } = useDebts();
  const [recurringPromptDismissed, setRecurringPromptDismissed] = useState<Record<string, boolean>>({});
  const [recurringConfirmed, setRecurringConfirmed] = useState<Record<string, boolean>>({});
  const { profile } = useBusinessProfile();
  const isVatRegistered = profile?.registration_status === 'registered_vat';
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const recorder = useAudioRecorder();
  const [micError, setMicError] = useState<string | null>(null);

  // Collapses the sidebar while the composer is active. Blurring restores it,
  // so the nav is always one click (or Escape) away.
  const { setComposerFocused } = useOutletContext<AppShellContext>();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      const transactions: ParsedTransaction[] = Array.isArray(data?.transactions) ? data.transactions : [];

      if (transactions.length === 0) {
        addMessage({ role: 'error', content: "Something went wrong — no transaction came back from that. Try rephrasing it." });
      } else {
        addMessage({
          role: 'assistant',
          content:
            transactions.length === 1
              ? "Here's what I understood:"
              : `I found ${transactions.length} separate transactions in that — here's what I understood:`,
          transactions,
        });
      }
    } catch (err: any) {
      console.error('Error parsing transaction:', err);
      // Honest failure — never invent a transaction to show in its place.
      addMessage({ role: 'error', content: `Couldn't parse that: ${err?.message ?? String(err)}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentQuery = input;
    setInput('');
    await submitToParser(currentQuery, 'text', currentQuery);
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

  const renderTransactionCards = (items: ParsedTransaction[]) => (
    <div className="mt-4 space-y-3">
      {items.map((item, idx) => {
        const cardKey = item.id ?? String(idx);

        if (item.needs_review) {
          return (
            <div
              key={item.id ?? idx}
              className="border-l-4 border-l-vanta-black bg-white p-5 rounded-r-xl border-t border-r border-b border-vanta-border"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-vanta-black flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Needs review
                </div>
              </div>
              <p className="text-sm text-vanta-black leading-relaxed mb-3">
                {item.description || item.raw_input || 'Could not confidently parse this transaction.'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-vanta-gray">
                {item.amount !== null && (
                  <span>
                    Best guess: <span className="font-mono font-semibold text-vanta-black">R{item.amount.toFixed(2)}</span>
                  </span>
                )}
                <span>
                  Category: <span className="font-medium text-vanta-black">{item.category}</span>
                </span>
              </div>
            </div>
          );
        }

        const recurringMatch = !recurringPromptDismissed[cardKey] && !recurringConfirmed[cardKey]
          ? findLikelyRecurringMatch(item, transactions)
          : null;

        return (
          <div
            key={item.id ?? idx}
            className="border-l-2 border-l-vanta-navy bg-white p-6 border-t border-r border-b border-vanta-border rounded-r-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.06)] space-y-4"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1 font-semibold">Category</div>
                <div className="text-lg font-serif text-vanta-black">{item.category}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-1 font-semibold">Amount</div>
                <div className="text-xl font-mono font-semibold text-vanta-black flex items-center gap-1 justify-end">
                  {item.direction === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  R{(item.amount ?? 0).toFixed(2)}
                </div>
              </div>
            </div>
            {item.description && <p className="text-sm text-vanta-gray">{item.description}</p>}

            {recurringConfirmed[cardKey] && (
              <div className="flex items-center gap-1.5 text-xs text-vanta-gray pt-3 border-t border-vanta-border">
                <Repeat size={12} />
                Marked as recurring
              </div>
            )}

            {recurringMatch && (
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-vanta-border">
                <span className="text-xs text-vanta-gray leading-snug flex items-center gap-1.5">
                  <Repeat size={12} className="shrink-0" />
                  This looks similar to "{recurringMatch.description || recurringMatch.raw_input}" from last time — mark as recurring?
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleMarkRecurring(item, cardKey)}
                    className="text-xs font-semibold uppercase tracking-widest text-vanta-navy hover:text-vanta-navy-dark px-2 py-1"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setRecurringPromptDismissed((prev) => ({ ...prev, [cardKey]: true }))}
                    aria-label="Dismiss"
                    className="p-1 text-vanta-gray hover:text-vanta-black"
                  >
                    <X size={13} />
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

  /** Supplementary business context beside the composer — never the hero. */
  const dashboardRail = (
    <div className="w-full lg:w-72 shrink-0 space-y-3">
      {dashboardError && (
        <div role="alert" className="flex items-start gap-2 text-[12px] text-vanta-danger px-1 leading-snug">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>Couldn't load transactions: {dashboardError}</span>
        </div>
      )}
      <NudgeBar transactions={transactions} debts={debts} isVatRegistered={isVatRegistered} />
      <LedgerSummary transactions={transactions} isLoading={dashboardLoading} />
      <ActivityFeed transactions={transactions} isLoading={dashboardLoading} onSelect={setSelectedTx} />
    </div>
  );

  const inputBar = (
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
        className="relative flex items-center rounded-2xl border border-vanta-border bg-white transition-shadow duration-150 group-focus-within:border-vanta-navy/40 group-focus-within:ring-4 group-focus-within:ring-vanta-navy/8"
        style={{ boxShadow: SHADOW_MD }}
      >
        <input
          ref={composerRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setComposerFocused(true)}
          onBlur={() => setComposerFocused(false)}
          placeholder={
            recorder.status === 'recording'
              ? 'Recording… tap the mic again to stop'
              : recorder.status === 'transcribing'
                ? 'Transcribing…'
                : 'Tell me what happened…'
          }
          disabled={recorder.status === 'transcribing'}
          className="w-full bg-transparent pl-5 py-4.5 pr-28 text-vanta-black placeholder-vanta-gray-light focus:outline-none text-[15px] disabled:cursor-wait"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach an Excel or CSV file"
            className="p-2 text-vanta-gray hover:text-vanta-black transition-colors duration-150 rounded-lg hover:bg-muted"
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
                  ? 'text-white bg-vanta-navy hover:bg-vanta-navy-dark animate-pulse'
                  : 'text-vanta-gray hover:text-vanta-black hover:bg-muted',
              )}
            >
              {recorder.status === 'recording' ? <Square size={16} /> : <Mic size={16} />}
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            title="Send"
            className="w-8 h-8 rounded-full bg-vanta-navy text-white flex items-center justify-center transition-all duration-150 disabled:opacity-30 hover:bg-vanta-navy-dark active:scale-[0.95]"
          >
            <Send size={14} />
          </button>
        </div>
        {!input && (
          <span className="absolute right-28 top-1/2 -translate-y-1/2 text-[11px] font-mono text-vanta-gray-light bg-muted border border-vanta-border rounded px-1.5 py-0.5 pointer-events-none hidden sm:inline-block">
            Enter
          </span>
        )}
      </div>
    </form>
  );

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onDelete={(tx) => deleteTransaction(tx.id)}
        />

        {/*
          Matches the reference template exactly: a plain light canvas
          throughout (never a dark/gradient background — that reads worse
          for a bookkeeping app where the Ledger and every data table need
          to stay legible on the same ground), with the brand gradient
          applied only to the accent word inside the heading, the same way
          the reference gradients just "John" inside "Hi there, John."
        */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-2xl flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-white p-2.5"
              style={{ boxShadow: SHADOW_MD }}
            >
              <img src={vantaLogoMark} alt="" className="w-full h-full object-contain" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
              <h1 className="text-[34px] md:text-[42px] font-semibold leading-[1.15] mb-3 text-wrap-balance">
                <span className="text-vanta-black">What happened in your </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(90deg, ${'#015AEA'}, ${'#0A93FD'})` }}
                >
                  business
                </span>
                <span className="text-vanta-black"> today?</span>
              </h1>
              <p className="text-[15px] text-vanta-gray mb-8">
                Use one of the examples below, or tell me in your own words.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 w-full"
            >
              {QUICK_PROMPT_CARDS.map((card) => (
                <motion.button
                  key={card.label}
                  onClick={() => handleQuickPrompt(card.example)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center text-center gap-1.5 p-5 rounded-2xl border border-vanta-border bg-white hover:border-vanta-navy/30 hover:bg-accent transition-colors duration-150"
                  style={{ boxShadow: SHADOW_SM }}
                >
                  <div className="text-[13px] font-medium text-vanta-black">{card.label}</div>
                  <div className="text-[12px] font-mono text-vanta-gray-light">{card.example}</div>
                </motion.button>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="w-full"
            >
              {inputBar}
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      <div className="relative flex-1 overflow-y-auto px-6 md:px-12 pt-8 pb-40">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0 space-y-6">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}
            >
              {msg.role === 'user' && (
                <div className="text-white p-4 rounded-2xl rounded-br-md max-w-xl bg-vanta-navy" style={{ boxShadow: SHADOW_SM }}>
                  {msg.content}
                </div>
              )}

              {msg.role === 'error' && (
                <div className="flex gap-4 max-w-2xl w-full">
                  <div className="w-9 h-9 rounded-lg bg-white border-2 border-vanta-black text-vanta-black shrink-0 flex items-center justify-center font-serif font-semibold text-sm">
                    !
                  </div>
                  <div className="flex-1 bg-white p-5 border-2 border-vanta-black rounded-2xl rounded-tl-md text-vanta-black text-sm">
                    {msg.content}
                  </div>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="flex gap-4 max-w-2xl w-full">
                  <div className="w-9 h-9 rounded-lg text-white shrink-0 flex items-center justify-center font-serif font-semibold text-sm bg-vanta-navy" style={{ boxShadow: SHADOW_SM }}>
                    V
                  </div>
                  <div className="flex-1 bg-white p-5 border border-vanta-border rounded-2xl rounded-tl-md">
                    <div className="text-vanta-black text-sm leading-relaxed">{msg.content}</div>
                    {msg.transactions && renderTransactionCards(msg.transactions)}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex gap-4 max-w-2xl">
              <div className="w-9 h-9 rounded-lg text-white shrink-0 flex items-center justify-center animate-pulse bg-vanta-navy" style={{ boxShadow: SHADOW_SM }}>
                <RefreshCw size={15} className="animate-spin" />
              </div>
              <div className="flex-1 bg-white p-4 border border-vanta-border rounded-2xl rounded-tl-md text-vanta-gray text-sm italic flex items-center">
                Thinking…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="hidden lg:block">{dashboardRail}</div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-30">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 space-y-3">
            {inputBar}
            <QuickActions onSelect={handleQuickPrompt} />
          </div>
          <div className="hidden lg:block w-80 shrink-0" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
