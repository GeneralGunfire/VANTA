import React, { useEffect, useState } from 'react';
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
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { cn } from '../lib/utils';
import { APP_SURFACE } from '../lib/surfaces';

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

const NAV_LINKS = [
  { id: 'product', label: 'How it works' },
  { id: 'demo', label: 'See it in action' },
  { id: 'faq', label: 'FAQ' },
];

const DUST = [
  { top: '9%', left: '7%', size: 2, delay: 0 },
  { top: '17%', left: '21%', size: 1, delay: 1.4 },
  { top: '12%', left: '38%', size: 2, delay: 2.6 },
  { top: '6%', left: '61%', size: 1, delay: 0.7 },
  { top: '15%', left: '79%', size: 2, delay: 3.1 },
  { top: '10%', left: '92%', size: 1, delay: 1.9 },
  { top: '28%', left: '13%', size: 1, delay: 2.2 },
  { top: '33%', left: '31%', size: 2, delay: 0.4 },
  { top: '26%', left: '68%', size: 1, delay: 3.4 },
  { top: '35%', left: '86%', size: 2, delay: 1.1 },
  { top: '44%', left: '5%', size: 2, delay: 2.9 },
  { top: '48%', left: '24%', size: 1, delay: 0.9 },
  { top: '41%', left: '74%', size: 1, delay: 2.4 },
  { top: '52%', left: '95%', size: 2, delay: 1.6 },
  { top: '58%', left: '11%', size: 1, delay: 3.8 },
  { top: '63%', left: '35%', size: 2, delay: 0.2 },
  { top: '57%', left: '64%', size: 1, delay: 2.7 },
  { top: '66%', left: '88%', size: 1, delay: 1.3 },
  { top: '74%', left: '18%', size: 2, delay: 3.3 },
  { top: '79%', left: '46%', size: 1, delay: 0.6 },
  { top: '72%', left: '81%', size: 2, delay: 2.1 },
  { top: '86%', left: '9%', size: 1, delay: 1.8 },
  { top: '88%', left: '57%', size: 2, delay: 3.6 },
  { top: '83%', left: '93%', size: 1, delay: 0.5 },
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

  // Scroll spy — the nav glow follows whichever section is in view, so clicking a
  // link and scrolling to it both land on the same active state.
  const [activeSection, setActiveSection] = useState(NAV_LINKS[0].id);

  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (inView[0]) setActiveSection(inView[0].target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const reduced = useReducedMotion() ?? false;
  const glowX = useTransform(springX, [-0.5, 0.5], ['42%', '58%']);
  const glowY = useTransform(springY, [-0.5, 0.5], ['0%', '18%']);

  return (
    <div
      className="relative min-h-screen text-zinc-100 font-sans antialiased selection:bg-vanta-navy selection:text-white"
      style={{ background: APP_SURFACE }}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 140px)',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="sticky top-0 z-50 px-4 pt-4 md:px-6">
        <header className="max-w-5xl mx-auto rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_12px_32px_-16px_rgba(0,0,0,0.8)]">
          <div className="px-4 md:px-6 py-2.5 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 pl-1">
              <span className="w-7 h-7 rounded-full bg-vanta-navy flex items-center justify-center text-white font-serif font-bold text-sm">
                V
              </span>
              <span className="text-lg font-serif font-bold text-zinc-50 tracking-tight">Vanta</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-white/55 bg-white/5 rounded-full p-1">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={() => setActiveSection(link.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'relative px-4 py-1.5 rounded-full transition-colors',
                      isActive ? 'text-zinc-50 font-semibold' : 'hover:text-white',
                    )}
                  >
                    {isActive && (
                      <>
                        <motion.span
                          layoutId="navActivePill"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          className="absolute inset-0 rounded-full bg-white/10"
                        />
                        <motion.span
                          layoutId="navActiveGlow"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          className="absolute inset-x-3 -bottom-px h-px bg-linear-to-r from-transparent via-[#7FB4F5] to-transparent shadow-[0_0_8px_rgba(127,180,245,0.9)]"
                        />
                      </>
                    )}
                    <span className="relative">{link.label}</span>
                  </a>
                );
              })}
            </nav>

            <Link
              to="/auth"
              className="bg-vanta-navy text-white px-5 py-2 text-sm font-semibold rounded-full hover:bg-[#2A6DC4] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(30,90,168,0.9)] active:scale-[0.97] active:translate-y-0"
            >
              Sign in
            </Link>
          </div>
        </header>
      </div>

      {/* Hero Section */}
      <section
        className="relative overflow-hidden min-h-dvh flex items-center"
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
        {/* Central light shaft — wide bloom, tight core, hot filament */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-full w-[46rem] max-w-[95vw] -translate-x-1/2 blur-3xl"
          style={{
            background:
              'linear-gradient(to bottom, rgba(96,165,250,0.42) 0%, rgba(59,130,246,0.20) 35%, rgba(37,99,235,0.06) 62%, transparent 82%)',
          }}
          animate={reduced ? undefined : { opacity: [0.75, 1, 0.75] }}
          transition={reduced ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[78%] w-40 -translate-x-1/2 blur-2xl"
          style={{
            background:
              'linear-gradient(to bottom, rgba(191,219,254,0.55) 0%, rgba(96,165,250,0.22) 40%, transparent 78%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[62%] w-0.5 -translate-x-1/2 blur-[2px]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(191,219,254,0.5) 32%, transparent 75%)',
          }}
        />

        {/* Horizon — a planet edge implied, not drawn. Restrained on purpose:
            one rim of light and a ground plane that fades out almost immediately. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] overflow-hidden">
          <div
            className="absolute bottom-0 left-1/2 h-[130%] w-[190%] -translate-x-1/2 translate-y-[38%] rounded-[50%]"
            style={{
              borderTop: '1px solid rgba(147,197,253,0.45)',
              background:
                'radial-gradient(ellipse 60% 55% at 50% 0%, rgba(30,90,168,0.22), rgba(6,14,27,0) 62%)',
              boxShadow: '0 -24px 70px -24px rgba(96,165,250,0.45)',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[70%] origin-bottom"
            style={{
              backgroundImage:
                'linear-gradient(rgba(147,197,253,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(147,197,253,0.10) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              transform: 'perspective(340px) rotateX(62deg)',
              maskImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 70%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 70%)',
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <div className="relative max-w-3xl mx-auto h-full">
            <div className="absolute left-6 top-8 bottom-8 border-l border-dashed border-white/10" />
            <div className="absolute right-6 top-8 bottom-8 border-r border-dashed border-white/10" />
            <span className="absolute -left-1.75 top-4 text-white/20">
              <Plus size={14} strokeWidth={2.5} />
            </span>
            <span className="absolute -right-1.75 top-4 text-white/20">
              <Plus size={14} strokeWidth={2.5} />
            </span>
            <span className="absolute -left-1.75 bottom-4 text-white/20">
              <Plus size={14} strokeWidth={2.5} />
            </span>
            <span className="absolute -right-1.75 bottom-4 text-white/20">
              <Plus size={14} strokeWidth={2.5} />
            </span>
          </div>
        </div>

        {/* Starfield — slow, uneven twinkle so it reads as depth rather than decoration */}
        <div className="pointer-events-none absolute inset-0">
          {DUST.map((d, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                top: d.top,
                left: d.left,
                width: d.size,
                height: d.size,
                boxShadow: '0 0 6px rgba(191,219,254,0.9)',
              }}
              animate={{ opacity: [0.15, 0.85, 0.15] }}
              transition={{ duration: 3.5 + (i % 5), repeat: Infinity, ease: 'easeInOut', delay: d.delay }}
            />
          ))}
        </div>

        <div className="relative w-full max-w-3xl mx-auto px-6 md:px-12 pt-24 pb-[clamp(2rem,5vh,4rem)] text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#8FBCEA] mb-[clamp(1rem,3vh,2.25rem)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8FBCEA]" />
            Bookkeeping, in plain language
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="font-serif font-bold tracking-tight leading-[1.03] text-[clamp(2.35rem,6.4vw+0.5rem,4.4rem)] text-balance"
            style={{
              backgroundImage:
                'linear-gradient(180deg, #FFFFFF 0%, #EAF2FF 42%, rgba(203,222,250,0.55) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Every sale.
            <br />
            Every expense.
            <br />
            <span className="relative inline-block text-[#7FB4F5]" style={{ WebkitTextFillColor: '#7FB4F5' }}>
              One conversation.
              <svg
                className="absolute left-0 -bottom-2 w-full h-3"
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M2 8.5C60 3 130 2 170 5.5C210 9 260 9.5 298 4"
                  stroke="#6FA3DE"
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
            className="text-white/55 text-[clamp(0.95rem,0.6vw+0.8rem,1.125rem)] leading-relaxed max-w-136 mt-[clamp(1rem,2.4vh,2rem)] font-normal text-balance"
          >
            Tell Vanta what happened in plain language. It keeps clean records and tells you
            exactly how business is going — no spreadsheets, no dashboards, no jargon.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-[clamp(1.5rem,3.2vh,2.5rem)]"
          >
            <span className="relative inline-block">
              <motion.span
                className="pointer-events-none absolute -inset-2 rounded-full bg-vanta-navy/45 blur-lg"
                animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.96, 1.04, 0.96] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Link
                to="/auth?mode=create"
                className="group relative inline-flex items-center gap-2 bg-vanta-navy text-white px-7 py-3.5 text-sm font-semibold rounded-full hover:bg-[#2A6DC4] transition-all shadow-[0_12px_28px_-10px_rgba(30,90,168,0.9)] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-10px_rgba(30,90,168,1)] active:scale-[0.98] active:translate-y-0"
              >
                Get started
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </span>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 border border-white/12 bg-white/5 px-7 py-3.5 text-sm font-semibold text-zinc-100 rounded-full hover:border-[#8FBCEA]/40 hover:text-white hover:bg-white/10 transition-all hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
            >
              <PlayCircle size={16} />
              See it in action
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-[clamp(1.25rem,2.6vh,2.25rem)] text-xs font-semibold text-white/50"
          >
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#8FBCEA]" /> No spreadsheets</span>
            <span className="w-1 h-1 rounded-full bg-vanta-border" />
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#8FBCEA]" /> No setup fees</span>
            <span className="w-1 h-1 rounded-full bg-vanta-border" />
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#8FBCEA]" /> Built for South Africa</span>
          </motion.div>

          {/* The proof, as a moment — not a mockup. Plain typography, floating in space. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="hidden [@media(min-height:44rem)]:flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 mt-[clamp(2rem,6vh,5rem)]"
          >
            <span className="font-mono text-sm text-white/50 italic">"sold 20 loaves R400 cash"</span>
            <motion.span
              className="text-[#8FBCEA]"
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles size={18} />
            </motion.span>
            <span className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-zinc-100">Sales</span>
              <span className="font-mono text-lg font-bold text-[#8FBCEA]">+R400.00</span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Section: how it works */}
      <section id="product" className="max-w-6xl mx-auto px-6 md:px-12 py-[clamp(4rem,9vh,6rem)]">
        <motion.div {...fadeUp} className="max-w-xl mx-auto text-center mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-[#8FBCEA] mb-4">How it works</div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-zinc-50 leading-tight text-balance">
            Talk, don't type.
          </h2>
          <p className="text-white/55 text-sm md:text-base leading-relaxed mt-4 text-balance">
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
                  <div className="text-xs bg-vanta-navy text-white rounded-xl rounded-br-sm px-3 py-2 w-fit ml-auto">How am I doing this week?</div>
                  <div className="text-xs bg-white/8 border border-white/10 text-zinc-100 rounded-xl rounded-bl-sm px-3 py-2 w-fit">You made R2,340 more than you spent.</div>
                </div>
              ),
            },
            {
              title: 'Never guesses silently',
              body: 'If Vanta isn’t sure, it flags it for you to confirm — and remembers your correction.',
              mock: (
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8FBCEA] bg-white/8 border border-white/10 rounded-full px-3 py-1.5">
                  <AlertTriangle size={12} /> Needs review
                </div>
              ),
            },
            {
              title: 'Upload what you have',
              body: 'Excel or CSV records work too — not just typing.',
              mock: (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-100 bg-white/8 border border-white/10 rounded-xl px-3 py-2">
                  <FileText size={14} className="text-[#8FBCEA]" /> stock_records.csv
                </div>
              ),
            },
            {
              title: 'Built for South Africa',
              body: 'Made for small, informal businesses first.',
              mock: (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-100 bg-white/8 border border-white/10 rounded-full px-3 py-2">
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
                'shrink-0 snap-start w-[78vw] sm:w-72 bg-white/5 border border-white/10 backdrop-blur-sm p-7 rounded-3xl hover:border-white/20 hover:shadow-[0_24px_48px_-20px_rgba(0,0,0,0.8),0_0_30px_-12px_rgba(30,90,168,0.5)] hover:-translate-y-1 transition-all duration-300',
                i % 2 === 1 && 'sm:mt-8',
              )}
            >
              <h3 className="font-bold text-zinc-50 text-base mb-2">{f.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed mb-5">{f.body}</p>
              {f.mock}
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2 sm:hidden">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Swipe</span>
          <ArrowRight size={11} className="text-white/40" />
        </div>
      </section>

      {/* Scene break — a single massive editorial statement, maximum whitespace */}
      <section className="max-w-3xl mx-auto px-6 md:px-12 py-[clamp(4rem,10vh,7rem)] text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-[clamp(1.6rem,3.2vw+0.6rem,3rem)] leading-[1.2] text-zinc-50 text-balance"
        >
          No dashboards to read.{' '}
          <span className="italic text-[#8FBCEA]">No spreadsheets to maintain.</span>{' '}
          Just tell Vanta what happened.
        </motion.p>
      </section>

      {/* Conversation strip — no card container; a real thread floating on the page */}
      <section id="demo" className="relative max-w-3xl mx-auto px-6 md:px-12 py-[clamp(4rem,10vh,7rem)]">
        <div className="pointer-events-none absolute left-1/2 top-8 bottom-8 border-l border-dashed border-white/10 -translate-x-1/2 hidden sm:block" />

        <motion.div {...fadeUp} className="text-center mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-[#8FBCEA] mb-4">See it in action</div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-zinc-50 leading-tight text-balance">
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
            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <div className="text-[9px] uppercase tracking-widest text-white/45 font-semibold">Sales</div>
              <div className="text-sm font-mono font-bold text-[#8FBCEA]">+R400.00</div>
            </div>
            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <div className="text-[9px] uppercase tracking-widest text-white/45 font-semibold">Stock</div>
              <div className="text-sm font-mono font-bold text-zinc-100">-R180.00</div>
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
            className="relative z-10 bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl rounded-bl-md px-5 py-3.5 text-sm text-zinc-100 w-fit ml-4 sm:ml-[calc(50%+1rem)] max-w-xs"
          >
            You made R2,340 more than you spent — and one record still needs your review.
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-xs text-white/40 italic text-center mt-14"
        >
          Your original words are kept on file, always — never edited away.
        </motion.p>
      </section>

      {/* Honesty — the parts we refuse to fake. Full-bleed, no cards, pure typography. */}
      <section
        className="relative text-white py-[clamp(4rem,10vh,7rem)] px-6 md:px-12 overflow-hidden border-y border-white/10"
        style={{ background: 'linear-gradient(160deg, #1E5AA8 0%, #17457F 55%, #0F2E58 100%)' }}
      >
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
      <section id="faq" className="max-w-3xl mx-auto px-6 md:px-12 py-[clamp(4rem,10vh,7rem)]">
        <motion.div {...fadeUp} className="mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-[#8FBCEA] mb-4">Questions</div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-zinc-50 leading-tight">
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
              className="grid grid-cols-[3rem_1fr] md:grid-cols-[4rem_1fr_1fr] gap-x-4 gap-y-2 py-7 border-t border-white/10"
            >
              <div className="font-serif text-2xl text-white/20 font-bold">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="font-bold text-zinc-50 text-base md:col-start-2">{item.q}</div>
              <div className="text-white/55 text-sm leading-relaxed col-start-2 md:col-start-3 md:row-start-1">{item.a}</div>
            </motion.div>
          ))}
          <div className="border-t border-white/10" />
        </div>
      </section>

      {/* CTA Banner */}
      <section
        className="relative text-white py-[clamp(4rem,10vh,7rem)] px-6 md:px-12 text-center overflow-hidden border-t border-white/10"
        style={{ background: 'linear-gradient(160deg, #2A6DC4 0%, #1E5AA8 45%, #12325F 100%)' }}
      >
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

      <footer className="border-t border-white/10 py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/45">
          <div>
            <div className="text-2xl font-serif font-bold text-zinc-50 mb-1">Vanta</div>
            <div className="text-[11px] text-white/45 font-sans">Built for South Africa</div>
          </div>

          <div className="flex items-center gap-8 font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
