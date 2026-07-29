import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Search, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { QUICK_ENTRIES, COMBINED_EXAMPLE, type EntryCategory } from '../data/quick-entries';

const CATEGORIES: (EntryCategory | 'All')[] = [
  'All',
  'Sales',
  'Stock',
  'Rent',
  'Utilities',
  'Transport',
  'Wages',
  'Other',
];

/** Money-in reads differently from money-out, so the two are visually separated. */
const MONEY_IN: EntryCategory[] = ['Sales'];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<EntryCategory | 'All'>('All');
  const [query, setQuery] = useState('');

  /** Templates open the composer pre-filled — the user still edits and sends it. */
  const useTemplate = (phrase: string) => {
    navigate('/app/chat', { state: { prefill: phrase } });
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QUICK_ENTRIES.filter((e) => {
      const matchesCategory = filter === 'All' || e.category === filter;
      const matchesQuery =
        q === '' || e.phrase.toLowerCase().includes(q) || e.hint.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [filter, query]);

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <div className="relative max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Templates</h1>
          <p className="text-xs text-white/45 mt-1">
            Common entries for a small business — tap one, change the amount, send it.
          </p>
        </div>

        {/* Search + category filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates"
              aria-label="Search templates"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-white/35 focus:outline-none focus:border-[#8FBCEA]/50 focus:bg-white/8 transition-colors"
            />
          </div>
          <div role="group" aria-label="Filter by category" className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                aria-pressed={filter === c}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
                  filter === c
                    ? 'border-white/25 bg-white/12 text-zinc-50'
                    : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/85',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Two-in-one example */}
        <motion.button
          type="button"
          onClick={() => useTemplate(COMBINED_EXAMPLE)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="group w-full text-left rounded-2xl border border-white/10 bg-white/4 p-5 transition-all hover:border-[#8FBCEA]/35 hover:bg-white/8"
        >
          <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8FBCEA]">
            <Layers size={13} />
            Two at once
          </div>
          <div className="font-mono text-sm text-zinc-100 mb-1.5">"{COMBINED_EXAMPLE}"</div>
          <p className="text-xs text-white/50">
            One message can hold more than one transaction — Vanta splits it into separate records.
          </p>
        </motion.button>

        {/* Template list */}
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/4 py-16 text-center">
            <p className="text-sm text-white/50">No templates match that.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilter('All');
              }}
              className="mt-4 rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/60 transition-colors hover:border-white/30 hover:text-zinc-50"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visible.map((entry, i) => (
              <motion.button
                key={entry.phrase}
                type="button"
                onClick={() => useTemplate(entry.phrase)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}
                className="group text-left rounded-xl border border-white/10 bg-white/4 p-4 transition-all hover:-translate-y-0.5 hover:border-[#8FBCEA]/35 hover:bg-white/8"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      MONEY_IN.includes(entry.category)
                        ? 'bg-[#8FBCEA]/15 text-[#8FBCEA]'
                        : 'bg-white/8 text-white/55',
                    )}
                  >
                    {entry.category}
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="shrink-0 text-white/25 transition-colors group-hover:text-[#8FBCEA]"
                  />
                </div>
                <div className="font-mono text-sm text-zinc-100 leading-snug mb-1.5">"{entry.phrase}"</div>
                <p className="text-xs text-white/45">{entry.hint}</p>
              </motion.button>
            ))}
          </div>
        )}

        <p className="text-xs text-white/35 pt-2">
          Amounts in templates are examples. Change them to what actually happened before sending —
          Vanta records exactly what you tell it.
        </p>
      </div>
    </div>
  );
}
