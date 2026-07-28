import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  Check,
  Code2,
  Copy,
  Database,
  Folder,
  Github,
  Globe,
  Search,
  Settings2,
  Sparkles,
  Star,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '../lib/utils';
import {
  CATEGORY_LABELS,
  MCP_SERVERS,
  type McpCategory,
  type McpServer,
} from '../data/mcp-servers';

/** JetBrains Mono is loaded alongside the app's other faces in index.html. */
const MONO = "font-['JetBrains_Mono',ui-monospace,monospace]";

/** The iridescent sweep used by the hero beam, focus rings and gradient text. */
const IRIDESCENT =
  'linear-gradient(90deg, #a78bfa 0%, #818cf8 25%, #38bdf8 50%, #22d3ee 70%, #a78bfa 100%)';

const CATEGORY_ICONS: Record<McpCategory, React.ComponentType<{ className?: string; size?: number }>> = {
  filesystem: Folder,
  database: Database,
  api: Globe,
  devtools: Code2,
  productivity: Settings2,
  ai: Sparkles,
};

const CATEGORY_COLORS: Record<McpCategory, string> = {
  filesystem: 'text-sky-300 bg-sky-400/10',
  database: 'text-violet-300 bg-violet-400/10',
  api: 'text-cyan-300 bg-cyan-400/10',
  devtools: 'text-indigo-300 bg-indigo-400/10',
  productivity: 'text-fuchsia-300 bg-fuchsia-400/10',
  ai: 'text-teal-300 bg-teal-400/10',
};

const FILTERS: (McpCategory | 'all')[] = [
  'all',
  'filesystem',
  'database',
  'api',
  'devtools',
  'productivity',
  'ai',
];

const CARD_SURFACE =
  'bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-xl';

/** Chrome shards floating behind the hero, mirroring the reference's 3D props. */
const SHARDS = [
  { top: '12%', left: '10%', size: 82, radius: '30%', rotate: -18, delay: 0, spin: 200 },
  { top: '38%', left: '4%', size: 62, radius: '50%', rotate: 24, delay: 1.1, spin: 340 },
  { top: '9%', left: '82%', size: 70, radius: '38%', rotate: 12, delay: 0.6, spin: 120 },
  { top: '44%', left: '88%', size: 96, radius: '26%', rotate: -28, delay: 1.6, spin: 20 },
  { top: '62%', left: '15%', size: 48, radius: '46%', rotate: 8, delay: 2.1, spin: 280 },
];

type LoadState = 'loading' | 'ready' | 'error';
type CopyState = 'idle' | 'copied' | 'failed';

/** Clipboard access fails on insecure origins and in some embedded webviews. */
function useCopyToClipboard() {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async (text: string) => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
    timer.current = setTimeout(() => setState('idle'), 2000);
  }, []);

  return { state, copy };
}

function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const { state, copy } = useCopyToClipboard();

  return (
    <button
      type="button"
      onClick={() => void copy(text)}
      aria-label={state === 'copied' ? `${label} copied` : `Copy ${label}`}
      className={cn(
        'shrink-0 rounded-md p-1.5 transition-colors',
        state === 'copied' && 'text-cyan-300',
        state === 'failed' && 'text-amber-400',
        state === 'idle' && 'text-zinc-500 hover:bg-white/10 hover:text-cyan-300',
        className,
      )}
    >
      {state === 'copied' ? <Check size={14} /> : <Copy size={14} />}
      <span aria-live="polite" className="sr-only">
        {state === 'copied' ? 'Copied to clipboard' : state === 'failed' ? 'Copy failed' : ''}
      </span>
    </button>
  );
}

/** Metallic shard — a conic gradient reads as brushed chrome without needing a 3D asset. */
function ChromeShard({ shard, reduced }: { shard: (typeof SHARDS)[number]; reduced: boolean }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute hidden lg:block"
      style={{ top: shard.top, left: shard.left }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={
        reduced
          ? { opacity: 0.75, scale: 1 }
          : { opacity: 0.75, scale: 1, y: [0, -18, 0], rotate: [shard.rotate, shard.rotate + 8, shard.rotate] }
      }
      transition={
        reduced
          ? { duration: 0.6 }
          : {
              opacity: { duration: 0.8, delay: shard.delay * 0.2 },
              scale: { duration: 0.8, delay: shard.delay * 0.2 },
              y: { duration: 7 + shard.delay, repeat: Infinity, ease: 'easeInOut', delay: shard.delay },
              rotate: { duration: 9 + shard.delay, repeat: Infinity, ease: 'easeInOut', delay: shard.delay },
            }
      }
    >
      <div
        style={{
          width: shard.size,
          height: shard.size,
          borderRadius: shard.radius,
          background: `conic-gradient(from ${shard.spin}deg at 45% 40%, #ffffff, #9ca3af, #f8fafc, #3f3f46, #e4e4e7, #6b7280, #ffffff)`,
          boxShadow: '0 20px 45px -18px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.6)',
        }}
      />
    </motion.div>
  );
}

function ServerCard({ server, index, onOpen }: { server: McpServer; index: number; onOpen: () => void }) {
  const Icon = CATEGORY_ICONS[server.category];
  const isStable = server.status === 'stable';

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
      className={cn(
        CARD_SURFACE,
        'group w-full rounded-2xl p-5 text-left transition-all duration-300',
        'hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_24px_50px_-16px_rgba(0,0,0,0.8),0_0_40px_-12px_rgba(129,140,248,0.35)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              CATEGORY_COLORS[server.category],
            )}
          >
            <Icon size={20} />
          </span>
          <span>
            <span className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100">{server.displayName}</h3>
              {server.verified && (
                <BadgeCheck size={14} className="text-cyan-300" aria-label="Verified server" />
              )}
            </span>
            <span className={cn(MONO, 'text-[11px] text-zinc-500')}>@{server.name}</span>
          </span>
        </div>

        <span className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 animate-pulse rounded-full',
              isStable ? 'bg-emerald-400' : 'bg-amber-400',
            )}
          />
          <span
            className={cn(MONO, 'text-[10px]', isStable ? 'text-emerald-400/70' : 'text-amber-400/70')}
          >
            {server.status}
          </span>
        </span>
      </div>

      <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-zinc-400">{server.description}</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {server.tools.slice(0, 3).map((tool) => (
          <span
            key={tool}
            className={cn(MONO, 'rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500')}
          >
            {tool}
          </span>
        ))}
        {server.tools.length > 3 && (
          <span className={cn(MONO, 'rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500')}>
            +{server.tools.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <span className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Star size={12} />
            {server.stars.toLocaleString('en-US')}
          </span>
          <span className="flex items-center gap-1">
            <Wrench size={12} />
            {server.tools.length} tools
          </span>
        </span>
        <span className={cn(MONO, 'text-[10px] text-zinc-600')}>{server.transport}</span>
      </div>
    </motion.button>
  );
}

function ServerModal({ server, onClose }: { server: McpServer; onClose: () => void }) {
  const [format, setFormat] = useState<'json' | 'yaml'>('json');
  const closeRef = useRef<HTMLButtonElement>(null);
  const Icon = CATEGORY_ICONS[server.category];
  const isStable = server.status === 'stable';
  const titleId = `mcp-server-${server.id}-title`;

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2 }}
        className={cn(CARD_SURFACE, 'relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6')}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-4 top-4 rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
        >
          <X size={20} />
        </button>

        <div className="mb-1 flex items-center gap-3">
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              CATEGORY_COLORS[server.category],
            )}
          >
            <Icon size={20} />
          </span>
          <span>
            <span className="flex items-center gap-2">
              <h2 id={titleId} className="text-lg font-bold text-zinc-100">
                {server.displayName}
              </h2>
              {server.verified && (
                <BadgeCheck size={16} className="text-cyan-300" aria-label="Verified server" />
              )}
            </span>
            <span className={cn(MONO, 'text-xs text-zinc-500')}>@{server.name}</span>
          </span>
        </div>

        <p className="mb-5 mt-4 text-sm leading-relaxed text-zinc-400">{server.description}</p>

        <div className="mb-5 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', isStable ? 'bg-emerald-400' : 'bg-amber-400')} />
            {server.status}
          </span>
          <span className="flex items-center gap-1.5">
            <Star size={12} /> {server.stars.toLocaleString('en-US')} stars
          </span>
          <span className="flex items-center gap-1.5">
            <Wrench size={12} /> {server.tools.length} tools
          </span>
          <span className={MONO}>{server.transport}</span>
        </div>

        <div className="mb-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">Tools</h3>
          <ul className="flex flex-wrap gap-1.5">
            {server.tools.map((tool) => (
              <li
                key={tool}
                className={cn(MONO, 'rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400')}
              >
                {tool}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">Install</h3>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2.5">
            <code className={cn(MONO, 'flex-1 overflow-x-auto text-xs text-cyan-300/90')}>{server.install}</code>
            <CopyButton text={server.install} label="install command" />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Config</h3>
            <div
              role="group"
              aria-label="Config format"
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5"
            >
              {(['json', 'yaml'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormat(value)}
                  aria-pressed={format === value}
                  className={cn(
                    MONO,
                    'rounded-md px-2.5 py-1 text-[10px] uppercase transition-colors',
                    format === value ? 'bg-white/15 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <pre
              className={cn(
                MONO,
                'overflow-x-auto whitespace-pre rounded-xl border border-white/10 bg-black/50 p-4 text-xs leading-relaxed text-zinc-400',
              )}
            >
              {server.config[format]}
            </pre>
            <CopyButton
              text={server.config[format]}
              label={`${format.toUpperCase()} config`}
              className="absolute right-2 top-2 bg-black/40 p-2"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function McpRegistryPage() {
  const [status, setStatus] = useState<LoadState>('loading');
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<McpCategory | 'all'>('all');
  const [selected, setSelected] = useState<McpServer | null>(null);

  const reduced = useReducedMotion() ?? false;
  const searchRef = useRef<HTMLInputElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      setServers(MCP_SERVERS);
      setStatus('ready');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return servers.filter((s) => {
      const matchesFilter = filter === 'all' || s.category === filter;
      const matchesQuery =
        q === '' ||
        s.name.toLowerCase().includes(q) ||
        s.displayName.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tools.some((t) => t.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [servers, query, filter]);

  const openServer = (server: McpServer) => {
    lastTriggerRef.current = document.activeElement as HTMLElement | null;
    setSelected(server);
  };

  const closeServer = () => {
    setSelected(null);
    lastTriggerRef.current?.focus();
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050507] text-zinc-50">
      {/* Grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(113,113,122,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(113,113,122,0.07) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 80%)',
        }}
      />
      {/* Film grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <nav className="relative z-50 px-6">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10">
              <Zap size={16} className="text-zinc-100" />
            </span>
            <span
              className={cn(
                MONO,
                'rounded-full border border-white/15 px-2 py-0.5 text-[9px] uppercase tracking-widest text-zinc-400',
              )}
            >
              beta
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#registry" className="hidden text-sm text-zinc-400 transition-colors hover:text-zinc-100 sm:block">
              Servers
            </a>
            <a href="#registry" className="hidden text-sm text-zinc-400 transition-colors hover:text-zinc-100 sm:block">
              Categories
            </a>
            <a href="#registry" className="hidden text-sm text-zinc-400 transition-colors hover:text-zinc-100 md:block">
              Docs
            </a>
            <a href="#registry" className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
              Submit
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 overflow-hidden px-6 pb-28 pt-10">
        {SHARDS.map((shard, i) => (
          <ChromeShard key={i} shard={shard} reduced={reduced} />
        ))}

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-7 flex items-center justify-center gap-2"
          >
            <Zap size={14} className="text-zinc-300" />
            <span className={cn(MONO, 'text-xs uppercase tracking-[0.28em] text-zinc-300')}>
              gimme your mcp
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-balance text-5xl font-bold leading-[1.05] tracking-tight text-zinc-50 sm:text-6xl lg:text-7xl"
          >
            Discover the best MCP servers
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg"
          >
            A curated registry of {MCP_SERVERS.length} Model Context Protocol servers. Preview the
            tools, copy the config, stop wrestling with JSON at 2am.
          </motion.p>

          {/* Beam search */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            className="relative mx-auto mt-16 max-w-2xl"
          >
            {/* Wide halo */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-32 w-[190%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-3xl"
              style={{ background: IRIDESCENT, opacity: 0.55 }}
              animate={reduced ? undefined : { opacity: [0.4, 0.65, 0.4] }}
              transition={reduced ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Tight core streak */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-9 w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-2xl"
              style={{ background: IRIDESCENT, opacity: 0.85 }}
            />
            {/* Filament */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-px w-[135%] -translate-x-1/2 -translate-y-1/2 blur-[1px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, #ffffff 35%, #ffffff 65%, transparent 100%)',
                opacity: 0.9,
              }}
            />

            {/* Gradient-bordered pill */}
            <div className="rounded-full p-px" style={{ background: IRIDESCENT }}>
              <div className="group flex items-center gap-3 rounded-full bg-[#08080c] px-6 py-4 transition-shadow focus-within:shadow-[0_0_40px_-6px_rgba(56,189,248,0.55)]">
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What do you need a server for?"
                  aria-label="Search MCP servers"
                  className="w-full flex-1 border-none bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500 sm:text-base"
                />
                <kbd
                  className={cn(
                    MONO,
                    'hidden items-center rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 sm:inline-flex',
                  )}
                >
                  ⌘K
                </kbd>
                <Search size={18} className="shrink-0 text-zinc-400" aria-hidden="true" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Registry */}
      <section id="registry" className="relative z-10 px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100">Featured servers</h2>
            <div role="group" aria-label="Filter by category" className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                  className={cn(
                    MONO,
                    'cursor-pointer rounded-full border px-3 py-1.5 text-[11px] transition-all',
                    filter === value
                      ? 'border-white/30 bg-white/15 text-zinc-100'
                      : 'border-white/10 text-zinc-500 hover:border-white/25 hover:text-zinc-200',
                  )}
                >
                  {CATEGORY_LABELS[value]}
                </button>
              ))}
            </div>
          </div>

          {status === 'loading' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={cn(CARD_SURFACE, 'h-52 animate-pulse rounded-2xl')} />
              ))}
              <span className="sr-only">Loading servers…</span>
            </div>
          ) : status === 'error' ? (
            <div role="alert" className={cn(CARD_SURFACE, 'rounded-2xl border-amber-400/30 px-6 py-16 text-center')}>
              <p className="text-sm text-amber-400">Couldn't load the registry.</p>
              <p className="mt-1 text-xs text-zinc-500">{loadError}</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mb-4 text-4xl text-zinc-700" aria-hidden="true">
                ∅
              </div>
              <p className="text-sm text-zinc-500">No servers match your search.</p>
              <p className="mt-1 text-xs text-zinc-600">Try different keywords or clear filters.</p>
              {(query || filter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setFilter('all');
                  }}
                  className={cn(
                    MONO,
                    'mt-5 rounded-full border border-white/15 px-4 py-1.5 text-xs text-zinc-400 transition-colors hover:border-white/30 hover:text-zinc-100',
                  )}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((server, i) => (
                <ServerCard key={server.id} server={server} index={i} onOpen={() => openServer(server)} />
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>{selected && <ServerModal server={selected} onClose={closeServer} />}</AnimatePresence>

      <footer className="relative z-10 border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className={MONO}>gimme your mcp</span>
            <span aria-hidden="true">·</span>
            <span>open source</span>
          </div>
          <div className="flex items-center gap-5 text-zinc-500">
            <a
              href="https://github.com/modelcontextprotocol"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="transition-colors hover:text-zinc-200"
            >
              <Github size={20} />
            </a>
            <a
              href="https://www.npmjs.com/search?q=modelcontextprotocol"
              target="_blank"
              rel="noreferrer"
              className={cn(MONO, 'text-sm transition-colors hover:text-zinc-200')}
            >
              npm
            </a>
            <a href="#registry" className={cn(MONO, 'text-sm transition-colors hover:text-zinc-200')}>
              discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
