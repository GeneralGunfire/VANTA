import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  PlayCircle,
  Plus,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { cn } from '../lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

const DUST = [
  { top: '12%', left: '8%', size: 5, delay: 0 },
  { top: '68%', left: '4%', size: 3, delay: 1.2 },
  { top: '22%', left: '92%', size: 4, delay: 0.6 },
  { top: '80%', left: '88%', size: 6, delay: 1.8 },
  { top: '48%', left: '96%', size: 3, delay: 2.4 },
  { top: '6%', left: '55%', size: 3, delay: 0.9 },
];

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('vanta_auth_status') === 'signed_in') {
      navigate('/app/chat');
    }
  }, [navigate]);

  // Cursor-reactive ambient glow — light drifting through the hero rather than UI elements reacting to it
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20, mass: 0.6 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20, mass: 0.6 });

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleHeroMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const glowX = useTransform(springX, [-0.5, 0.5], ['42%', '58%']);
  const glowY = useTransform(springY, [-0.5, 0.5], ['0%', '18%']);

  return (
    <div className="relative min-h-screen bg-vanta-bg text-vanta-black font-sans antialiased selection:bg-vanta-navy selection:text-white">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, #E2E5EA 0px, #E2E5EA 1px, transparent 1px, transparent 140px)',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(#E2E5EA 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="sticky top-0 z-50 px-4 pt-4 md:px-6">
        <header className="max-w-5xl mx-auto rounded-full border border-vanta-border/80 bg-white/80 backdrop-blur-xl shadow-[0_1px_1px_rgba(28,28,28,0.03),0_12px_32px_-16px_rgba(28,28,28,0.14)]">
          <div className="px-4 md:px-6 py-2.5 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 pl-1">
              <span className="w-7 h-7 rounded-full bg-vanta-navy flex items-center justify-center text-white font-serif font-bold text-sm">
                V
              </span>
              <span className="text-lg font-serif font-bold text-vanta-black tracking-tight">Vanta</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-vanta-gray bg-vanta-sidebar/70 rounded-full p-1">
              <a
                href="#product"
                className="px-4 py-1.5 rounded-full text-vanta-black bg-white shadow-[0_1px_2px_rgba(28,28,28,0.06)] font-semibold"
              >
                How it works
              </a>
              <a href="#demo" className="px-4 py-1.5 rounded-full hover:text-vanta-black transition-colors">
                See it in action
              </a>
              <a href="#faq" className="px-4 py-1.5 rounded-full hover:text-vanta-black transition-colors">
                FAQ
              </a>
            </nav>

            <Link
              to="/auth"
              className="bg-vanta-black text-white px-5 py-2 text-sm font-semibold rounded-full hover:bg-vanta-navy transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(30,90,168,0.5)] active:scale-[0.97] active:translate-y-0"
            >
              Sign in
            </Link>
          </div>
        </header>
      </div>

      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
        {/* Layered atmosphere — this is the artwork, not a backdrop for a mockup */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: useTransform(
              [glowX, glowY],
              ([x, y]) => `radial-gradient(ellipse 65% 55% at ${x} ${y}, rgba(30,90,168,0.13), transparent 70%)`,
            ),
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 40% 35% at 85% 75%, rgba(30,90,168,0.06), transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            color: '#E0E4EA',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 20%, black 30%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 20%, black 30%, transparent 85%)',
          }}
        />
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <div className="relative max-w-3xl mx-auto h-full">
            <div className="absolute left-6 top-8 bottom-8 border-l border-dashed border-vanta-border" />
            <div className="absolute right-6 top-8 bottom-8 border-r border-dashed border-vanta-border" />
            <span className="absolute -left-1.75 top-4 bg-vanta-bg text-vanta-border">
              <Plus size={14} strokeWidth={2.5} />
            </span>
            <span className="absolute -right-1.75 top-4 bg-vanta-bg text-vanta-border">
              <Plus size={14} strokeWidth={2.5} />
            </span>
            <span className="absolute -left-1.75 bottom-4 bg-vanta-bg text-vanta-border">
              <Plus size={14} strokeWidth={2.5} />
            </span>
            <span className="absolute -right-1.75 bottom-4 bg-vanta-bg text-vanta-border">
              <Plus size={14} strokeWidth={2.5} />
            </span>
          </div>
        </div>

        {/* Ambient floating dust — tiny, monochrome-blue, barely-there atmosphere */}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          {DUST.map((d, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-vanta-navy"
              style={{ top: d.top, left: d.left, width: d.size, height: d.size, opacity: 0.18 }}
              animate={{ y: [0, -14, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: d.delay }}
            />
          ))}
        </div>

        <div className="relative max-w-3xl mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-32 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-vanta-border bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-vanta-navy mb-9 shadow-[0_1px_2px_rgba(28,28,28,0.04)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-vanta-navy" />
            Bookkeeping, in plain language
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="font-serif font-bold tracking-tight leading-[1.02] text-[3.1rem] sm:text-6xl lg:text-[4.4rem] text-vanta-black text-balance"
          >
            Every sale.
            <br />
            Every expense.
            <br />
            <span className="relative inline-block text-vanta-navy">
              One conversation.
              <svg
                className="absolute left-0 -bottom-2 w-full h-3"
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M2 8.5C60 3 130 2 170 5.5C210 9 260 9.5 298 4"
                  stroke="#1E5AA8"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.35"
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-vanta-gray text-base md:text-lg leading-relaxed max-w-136 mt-8 font-normal text-balance"
          >
            Tell Vanta what happened in plain language. It keeps clean records and tells you
            exactly how business is going — no spreadsheets, no dashboards, no jargon.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-10"
          >
            <span className="relative inline-block">
              <motion.span
                className="pointer-events-none absolute -inset-2 rounded-full bg-vanta-navy/25 blur-lg"
                animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.96, 1.04, 0.96] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Link
                to="/auth?mode=create"
                className="group relative inline-flex items-center gap-2 bg-vanta-black text-white px-7 py-3.5 text-sm font-semibold rounded-full hover:bg-vanta-navy transition-all shadow-[0_1px_2px_rgba(28,28,28,0.06),0_12px_24px_-8px_rgba(28,28,28,0.25)] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-10px_rgba(30,90,168,0.45)] active:scale-[0.98] active:translate-y-0"
              >
                Get started
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </span>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 border border-vanta-border bg-white px-7 py-3.5 text-sm font-semibold text-vanta-black rounded-full hover:border-vanta-navy hover:text-vanta-navy transition-all hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
            >
              <PlayCircle size={16} />
              See it in action
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-9 text-xs font-semibold text-vanta-gray"
          >
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-vanta-navy" /> No spreadsheets</span>
            <span className="w-1 h-1 rounded-full bg-vanta-border" />
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-vanta-navy" /> No setup fees</span>
            <span className="w-1 h-1 rounded-full bg-vanta-border" />
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-vanta-navy" /> Built for South Africa</span>
          </motion.div>

          {/* The proof, as a moment — not a mockup. Plain typography, floating in space. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 mt-20"
          >
            <span className="font-mono text-sm text-vanta-gray italic">"sold 20 loaves R400 cash"</span>
            <motion.span
              className="text-vanta-navy"
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles size={18} />
            </motion.span>
            <span className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-vanta-black">Sales</span>
              <span className="font-mono text-lg font-bold text-vanta-navy">+R400.00</span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Section: how it works */}
      <section id="product" className="max-w-6xl mx-auto px-6 md:px-12 py-24">
        <motion.div {...fadeUp} className="max-w-xl mx-auto text-center mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-vanta-navy mb-4">How it works</div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-vanta-black leading-tight text-balance">
            Talk, don't type.
          </h2>
          <p className="text-vanta-gray text-sm md:text-base leading-relaxed mt-4 text-balance">
            Describe a sale or expense the way you'd tell a friend. Vanta turns it into a clean,
            structured record — and asks if it isn't sure, rather than guessing silently.
          </p>
        </motion.div>

        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 -mx-6 px-6 md:-mx-12 md:px-12 scrollbar-none">
          {[
            {
              title: 'Plain-English answers',
              body: 'No dashboards or charts. Ask "how am I doing?" and get a real sentence back.',
              mock: (
                <div className="space-y-2">
                  <div className="text-xs bg-vanta-sidebar rounded-xl rounded-br-sm px-3 py-2 w-fit ml-auto">How am I doing this week?</div>
                  <div className="text-xs bg-white border border-vanta-border rounded-xl rounded-bl-sm px-3 py-2 w-fit">You made R2,340 more than you spent.</div>
                </div>
              ),
            },
            {
              title: 'Never guesses silently',
              body: 'If Vanta isn’t sure, it flags it for you to confirm — and remembers your correction.',
              mock: (
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-vanta-navy bg-vanta-sidebar border border-vanta-border rounded-full px-3 py-1.5">
                  <AlertTriangle size={12} /> Needs review
                </div>
              ),
            },
            {
              title: 'Upload what you have',
              body: 'Excel or CSV records work too — not just typing.',
              mock: (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-vanta-black bg-vanta-sidebar border border-vanta-border rounded-xl px-3 py-2">
                  <FileText size={14} className="text-vanta-navy" /> stock_records.csv
                </div>
              ),
            },
            {
              title: 'Built for South Africa',
              body: 'Made for small, informal businesses first.',
              mock: (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-vanta-black bg-vanta-sidebar border border-vanta-border rounded-full px-3 py-2">
                  🇿🇦 Spaza shops &amp; side hustles
                </div>
              ),
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={cn(
                'shrink-0 snap-start w-[78vw] sm:w-72 bg-white border border-vanta-border p-7 rounded-3xl shadow-[0_1px_2px_rgba(28,28,28,0.03)] hover:shadow-[0_24px_48px_-24px_rgba(28,28,28,0.18)] hover:-translate-y-1 transition-all duration-300',
                i % 2 === 1 && 'sm:mt-8',
              )}
            >
              <h3 className="font-bold text-vanta-black text-base mb-2">{f.title}</h3>
              <p className="text-vanta-gray text-sm leading-relaxed mb-5">{f.body}</p>
              {f.mock}
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2 sm:hidden">
          <span className="text-[10px] uppercase tracking-widest text-vanta-gray font-semibold">Swipe</span>
          <ArrowRight size={11} className="text-vanta-gray" />
        </div>
      </section>

      {/* Scene break — a single massive editorial statement, maximum whitespace */}
      <section className="max-w-3xl mx-auto px-6 md:px-12 py-28 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-3xl md:text-5xl leading-[1.2] text-vanta-black text-balance"
        >
          No dashboards to read.{' '}
          <span className="italic text-vanta-navy">No spreadsheets to maintain.</span>{' '}
          Just tell Vanta what happened.
        </motion.p>
      </section>

      {/* Conversation strip — no card container; a real thread floating on the page */}
      <section id="demo" className="relative max-w-3xl mx-auto px-6 md:px-12 py-28">
        <div className="pointer-events-none absolute left-1/2 top-8 bottom-8 border-l border-dashed border-vanta-border -translate-x-1/2 hidden sm:block" />

        <motion.div {...fadeUp} className="text-center mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-vanta-navy mb-4">See it in action</div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-vanta-black leading-tight text-balance">
            One message in. A clean record out.
          </h2>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16, rotate: 1.5 }}
            whileInView={{ opacity: 1, y: 0, rotate: 1.5 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="relative z-10 bg-vanta-navy text-white rounded-2xl rounded-br-md px-5 py-3.5 text-sm w-fit ml-auto mr-4 sm:mr-[calc(50%+1rem)] max-w-xs shadow-[0_16px_32px_-12px_rgba(30,90,168,0.4)]"
          >
            sold 20 loaves R400 cash, bought flour for R180
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16, rotate: -1 }}
            whileInView={{ opacity: 1, y: 0, rotate: -1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative z-10 flex flex-wrap gap-3 ml-4 sm:ml-[calc(50%+1rem)]"
          >
            <div className="bg-white border border-vanta-border rounded-xl px-4 py-2.5 shadow-[0_12px_24px_-12px_rgba(28,28,28,0.2)]">
              <div className="text-[9px] uppercase tracking-widest text-vanta-gray font-semibold">Sales</div>
              <div className="text-sm font-mono font-bold text-vanta-navy">+R400.00</div>
            </div>
            <div className="bg-white border border-vanta-border rounded-xl px-4 py-2.5 shadow-[0_12px_24px_-12px_rgba(28,28,28,0.2)]">
              <div className="text-[9px] uppercase tracking-widest text-vanta-gray font-semibold">Stock</div>
              <div className="text-sm font-mono font-bold text-vanta-black">-R180.00</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16, rotate: 1 }}
            whileInView={{ opacity: 1, y: 0, rotate: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 bg-vanta-navy text-white rounded-2xl rounded-br-md px-5 py-3.5 text-sm w-fit ml-auto mr-4 sm:mr-[calc(50%+1rem)] max-w-xs shadow-[0_16px_32px_-12px_rgba(30,90,168,0.4)]"
          >
            how am I doing this month?
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16, rotate: -1.5 }}
            whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative z-10 bg-white border border-vanta-border rounded-2xl rounded-bl-md px-5 py-3.5 text-sm text-vanta-black w-fit ml-4 sm:ml-[calc(50%+1rem)] max-w-xs shadow-[0_12px_24px_-12px_rgba(28,28,28,0.15)]"
          >
            You made R2,340 more than you spent — and one record still needs your review.
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-xs text-vanta-gray italic text-center mt-14"
        >
          Your original words are kept on file, always — never edited away.
        </motion.p>
      </section>

      {/* Honesty — the parts we refuse to fake. Full-bleed, no cards, pure typography. */}
      <section className="relative bg-vanta-navy text-white py-28 px-6 md:px-12 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            color: 'rgba(255,255,255,0.08)',
          }}
        />
        <div className="relative max-w-2xl mx-auto">
          <motion.div {...fadeUp} className="text-xs font-bold uppercase tracking-widest text-white/60 mb-10 text-center">
            The parts we refuse to fake
          </motion.div>
          <div className="space-y-8">
            {[
              'We never invent a transaction.',
              'We never show you a number that isn\'t real.',
              'If we\'re not sure, we say so — out loud.',
              'Your original words are always kept, never quietly edited away.',
            ].map((line, i) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className={cn(
                  'font-serif text-2xl md:text-3xl leading-snug border-t border-white/15 pt-8',
                  i % 2 === 0 ? 'text-left' : 'text-right',
                )}
              >
                {line}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — editorial numbered list, no card chrome */}
      <section id="faq" className="max-w-3xl mx-auto px-6 md:px-12 py-28">
        <motion.div {...fadeUp} className="mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-vanta-navy mb-4">Questions</div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-vanta-black leading-tight">
            Good to know
          </h2>
        </motion.div>

        <div>
          {[
            {
              q: 'Do I need to know accounting to use Vanta?',
              a: 'No. Describe what happened the way you\'d tell a friend — Vanta handles the categorizing and the bookkeeping terms.',
            },
            {
              q: "What happens if Vanta isn't sure about something?",
              a: 'It flags the record as "needs review" instead of guessing, and remembers your correction for next time.',
            },
            {
              q: "I don't have a registered business — can I still use it?",
              a: 'Yes. Vanta is built for small, informal businesses first — spaza shops, side hustles, and sole proprietors, registered or not.',
            },
            {
              q: 'Is my business data private?',
              a: "Your records stay tied to your own account and aren't shared with anyone else.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="grid grid-cols-[3rem_1fr] md:grid-cols-[4rem_1fr_1fr] gap-x-4 gap-y-2 py-7 border-t border-vanta-border"
            >
              <div className="font-serif text-2xl text-vanta-border font-bold">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="font-bold text-vanta-black text-base md:col-start-2">{item.q}</div>
              <div className="text-vanta-gray text-sm leading-relaxed col-start-2 md:col-start-3 md:row-start-1">{item.a}</div>
            </motion.div>
          ))}
          <div className="border-t border-vanta-border" />
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative bg-vanta-navy text-white py-28 px-6 md:px-12 text-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(255,255,255,0.08), transparent 70%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: -20, rotate: -6 }}
          whileInView={{ opacity: 1, y: 0, rotate: -4 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="hidden md:block absolute -top-10 left-1/2 -translate-x-55 bg-white/95 backdrop-blur-md border border-white/40 rounded-2xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)] p-4 w-44 text-left"
        >
          <div className="text-[9px] uppercase tracking-widest text-vanta-gray font-semibold mb-1">Category</div>
          <div className="text-sm font-bold text-vanta-black mb-2">Sales</div>
          <div className="text-lg font-mono font-bold text-vanta-navy">+R400.00</div>
        </motion.div>

        <motion.div {...fadeUp} className="relative max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif italic tracking-tight leading-tight text-white text-balance">
            The future of bookkeeping is a conversation.
          </h2>
          <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-xl mx-auto font-normal">
            No spreadsheets. No setup fees.
          </p>
          <div className="pt-2">
            <Link
              to="/auth?mode=create"
              className="inline-flex items-center gap-2 bg-white text-vanta-navy px-8 py-4 text-sm font-semibold rounded-full hover:bg-gray-100 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.35)] active:scale-[0.98] active:translate-y-0"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="bg-vanta-bg border-t border-vanta-border py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-vanta-gray">
          <div>
            <div className="text-2xl font-serif font-bold text-vanta-navy mb-1">Vanta</div>
            <div className="text-[11px] text-vanta-gray font-sans">Built for South Africa</div>
          </div>

          <div className="flex items-center gap-8 font-medium">
            <a href="#" className="hover:text-vanta-navy transition-colors">Privacy</a>
            <a href="#" className="hover:text-vanta-navy transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
