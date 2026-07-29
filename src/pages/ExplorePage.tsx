import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Layers,
  HelpCircle,
  AlertTriangle,
  FileSpreadsheet,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { QUESTION_EXAMPLES } from '../data/quick-entries';

const CAPABILITIES = [
  {
    icon: MessageSquare,
    title: 'Say what happened',
    body: 'Describe a sale or expense the way you would to a friend. No forms, no categories to pick.',
    example: 'sold 20 loaves R400 cash',
    tryIt: true,
  },
  {
    icon: Layers,
    title: 'Several at once',
    body: 'One message can hold more than one transaction. Vanta separates them into their own records.',
    example: 'sold bread R400, bought flour R180',
    tryIt: true,
  },
  {
    icon: HelpCircle,
    title: 'Ask how business is going',
    body: 'You get a plain-English sentence back — never a chart or a dashboard to decipher.',
    example: "how's business this week?",
    tryIt: true,
  },
  {
    icon: AlertTriangle,
    title: 'It flags what it is unsure of',
    body: 'If Vanta cannot confidently read a message, it marks the record "needs review" and asks you, rather than guessing quietly.',
    example: null,
    tryIt: false,
  },
  {
    icon: ShieldCheck,
    title: 'Your words are kept',
    body: 'Every record stores exactly what you originally typed alongside the tidied version, so you can always check what it did.',
    example: null,
    tryIt: false,
  },
  {
    icon: FileSpreadsheet,
    title: 'Upload a file',
    body: 'Attach an Excel or CSV file in chat. Reading records straight out of a file is still being built — for now, describe them in words.',
    example: null,
    tryIt: false,
    badge: 'In progress',
  },
];

const CATEGORY_GUIDE: { name: string; belongs: string }[] = [
  { name: 'Sales', belongs: 'Money customers pay you' },
  { name: 'Stock', belongs: 'Goods and ingredients you buy to sell' },
  { name: 'Rent', belongs: 'Your shop, stand or table' },
  { name: 'Utilities', belongs: 'Electricity, water, gas' },
  { name: 'Transport', belongs: 'Taxi fare, petrol, deliveries' },
  { name: 'Wages', belongs: 'Anyone you pay to help' },
  { name: 'Other', belongs: "Anything that doesn't fit above" },
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const send = (phrase: string) => navigate('/app/chat', { state: { prefill: phrase } });

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <div className="relative max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Explore</h1>
          <p className="text-xs text-white/45 mt-1">What you can say to Vanta, and what it does with it.</p>
        </div>

        {/* Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CAPABILITIES.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
              className="rounded-2xl border border-white/10 bg-white/4 p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#8FBCEA]">
                  <c.icon size={16} />
                </span>
                {c.badge && (
                  <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    {c.badge}
                  </span>
                )}
              </div>
              <h2 className="text-sm font-semibold text-zinc-50 mb-1.5">{c.title}</h2>
              <p className="text-xs leading-relaxed text-white/50">{c.body}</p>

              {c.example && (
                <button
                  type="button"
                  onClick={() => c.tryIt && send(c.example!)}
                  className="group mt-4 flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-left transition-colors hover:border-[#8FBCEA]/35 hover:bg-white/8"
                >
                  <span className="font-mono text-xs text-zinc-200">"{c.example}"</span>
                  <ArrowUpRight
                    size={13}
                    className="shrink-0 text-white/25 transition-colors group-hover:text-[#8FBCEA]"
                  />
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Questions you can ask */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-50 mb-1">Questions you can ask</h2>
          <p className="text-xs text-white/45 mb-3">Answers come back as a sentence, not a chart.</p>
          <div className="flex flex-wrap gap-2">
            {QUESTION_EXAMPLES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs text-zinc-200 transition-colors hover:border-[#8FBCEA]/35 hover:bg-white/10"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>

        {/* Category reference */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-50 mb-1">Where things get filed</h2>
          <p className="text-xs text-white/45 mb-3">
            Vanta sorts every record into one of these. You never have to pick one yourself.
          </p>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            {CATEGORY_GUIDE.map((c, i) => (
              <div
                key={c.name}
                className={`flex items-center gap-4 bg-white/4 px-5 py-3 ${
                  i > 0 ? 'border-t border-white/10' : ''
                }`}
              >
                <span className="w-24 shrink-0 text-sm font-semibold text-zinc-100">{c.name}</span>
                <span className="text-xs text-white/50">{c.belongs}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
