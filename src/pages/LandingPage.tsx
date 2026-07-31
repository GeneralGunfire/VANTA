import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, PlayCircle, ShieldCheck, FileText, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import logoMark from '../assets/vanta-logo-mark.jpeg';
import heroDesktop from '../assets/vanta-hero-desktop.jpeg';
import heroMobile from '../assets/vanta-hero-mobile.jpeg';

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

/** Hero copy, set into the open space of the brand render — shared between the mobile and desktop crops. */
function HeroCopy() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white mb-[clamp(1rem,3vh,1.75rem)]"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
        Bookkeeping, in plain language
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.05 }}
        className="font-serif font-bold tracking-tight leading-[1.08] text-[clamp(2rem,5vw+0.5rem,3.2rem)] text-balance text-white"
      >
        Every sale. Every expense.
        <br />
        <span className="text-[#8FC0FF]">One conversation.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-white/75 text-[clamp(0.9rem,0.5vw+0.8rem,1.05rem)] leading-relaxed max-w-110 mt-[clamp(0.9rem,2vh,1.5rem)] font-normal text-balance"
      >
        Tell Vanta what happened in plain language. It keeps clean records and tells you
        exactly how business is going — no spreadsheets, no dashboards, no jargon.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22 }}
        className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-[clamp(1.25rem,2.8vh,2rem)]"
      >
        <Link
          to="/auth?mode=create"
          className="group relative inline-flex items-center gap-2 bg-white text-vanta-navy px-7 py-3.5 text-sm font-semibold rounded-full hover:bg-white/90 transition-all active:scale-[0.98]"
        >
          Get started
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
        <a
          href="#demo"
          className="inline-flex items-center gap-2 border border-white/30 bg-white/10 backdrop-blur-sm px-7 py-3.5 text-sm font-semibold text-white rounded-full hover:bg-white/15 transition-all active:scale-[0.98]"
        >
          <PlayCircle size={16} />
          See it in action
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-[clamp(1.1rem,2.4vh,1.75rem)] text-xs font-semibold text-white/70"
      >
        <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#8FC0FF]" /> No spreadsheets</span>
        <span className="w-1 h-1 rounded-full bg-white/30" />
        <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#8FC0FF]" /> No setup fees</span>
        <span className="w-1 h-1 rounded-full bg-white/30" />
        <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#8FC0FF]" /> Built for South Africa</span>
      </motion.div>
    </>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('vanta_auth_status') === 'signed_in') {
      navigate('/app/chat');
    }
  }, [navigate]);

  // Scroll spy — the nav highlight follows whichever section is in view, so clicking a
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

  return (
    <div className="relative min-h-screen bg-white text-vanta-black font-sans antialiased selection:bg-vanta-navy selection:text-white">
      <div className="sticky top-0 z-50 px-4 pt-4 md:px-6">
        <header className="max-w-5xl mx-auto rounded-full border border-vanta-border bg-white/90 backdrop-blur-xl shadow-[0_8px_24px_-12px_rgba(28,28,28,0.12)]">
          <div className="px-4 md:px-6 py-2.5 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 pl-1">
              <img src={logoMark} alt="Vanta" className="w-7 h-7 rounded-full object-cover" />
              <span className="text-lg font-serif font-bold text-vanta-black tracking-tight">Vanta</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-vanta-gray bg-vanta-sidebar rounded-full p-1">
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
                      isActive ? 'text-vanta-navy font-semibold bg-white shadow-sm' : 'hover:text-vanta-black',
                    )}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>

            <Link
              to="/auth"
              className="bg-vanta-navy text-white px-5 py-2 text-sm font-semibold rounded-full hover:bg-vanta-navy-dark transition-all active:scale-[0.97]"
            >
              Sign in
            </Link>
          </div>
        </header>
      </div>

      {/* Hero Section — the brand's own gradient render, text set into its open space */}
      <section className="relative overflow-hidden min-h-dvh flex items-center text-white">
        <img
          src={heroDesktop}
          alt=""
          className="hidden md:block absolute inset-0 w-full h-full object-cover"
        />
        <img
          src={heroMobile}
          alt=""
          className="md:hidden absolute inset-0 w-full h-full object-cover"
        />

        {/* Mobile: copy sits in the open space beneath the logo lockup */}
        <div className="md:hidden relative w-full px-6 pt-[38dvh] pb-16 text-center flex flex-col items-center">
          <HeroCopy />
        </div>

        {/* Desktop: copy sits to the right of the logo, which renders in the image's left-center */}
        <div className="hidden md:flex relative w-full max-w-6xl mx-auto px-12 lg:px-16 items-center">
          <div className="ml-auto w-full max-w-lg text-left">
            <HeroCopy />
          </div>
        </div>
      </section>

      {/* Section: how it works */}
      <section id="product" className="max-w-6xl mx-auto px-6 md:px-12 py-[clamp(4rem,9vh,6rem)]">
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
                  <div className="text-xs bg-vanta-navy text-white rounded-xl rounded-br-sm px-3 py-2 w-fit ml-auto">How am I doing this week?</div>
                  <div className="text-xs bg-vanta-sidebar border border-vanta-border text-vanta-black rounded-xl rounded-bl-sm px-3 py-2 w-fit">You made R2,340 more than you spent.</div>
                </div>
              ),
            },
            {
              title: 'Never guesses silently',
              body: 'If Vanta isn’t sure, it flags it for you to confirm — and remembers your correction.',
              mock: (
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-vanta-black bg-white border-2 border-vanta-black rounded-full px-3 py-1.5">
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
                'shrink-0 snap-start w-[78vw] sm:w-72 bg-white border border-vanta-border p-7 rounded-3xl hover:border-vanta-navy/30 hover:-translate-y-1 transition-all duration-300',
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

      {/* Scene break — a single editorial statement, maximum whitespace */}
      <section className="max-w-3xl mx-auto px-6 md:px-12 py-[clamp(4rem,10vh,7rem)] text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-[clamp(1.6rem,3.2vw+0.6rem,3rem)] leading-[1.2] text-vanta-black text-balance"
        >
          No dashboards to read.{' '}
          <span className="italic text-vanta-navy">No spreadsheets to maintain.</span>{' '}
          Just tell Vanta what happened.
        </motion.p>
      </section>

      {/* Conversation strip — no card container; a real thread floating on the page */}
      <section id="demo" className="relative max-w-3xl mx-auto px-6 md:px-12 py-[clamp(4rem,10vh,7rem)]">
        <div className="pointer-events-none absolute left-1/2 top-8 bottom-8 border-l border-dashed border-vanta-border -translate-x-1/2 hidden sm:block" />

        <motion.div {...fadeUp} className="text-center mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-vanta-navy mb-4">See it in action</div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-vanta-black leading-tight text-balance">
            One message in. A clean record out.
          </h2>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="relative z-10 bg-vanta-navy text-white rounded-2xl rounded-br-md px-5 py-3.5 text-sm w-fit ml-auto mr-4 sm:mr-[calc(50%+1rem)] max-w-xs"
          >
            sold 20 loaves R400 cash, bought flour for R180
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative z-10 flex flex-wrap gap-3 ml-4 sm:ml-[calc(50%+1rem)]"
          >
            <div className="bg-white border border-vanta-border rounded-xl px-4 py-2.5">
              <div className="text-[9px] uppercase tracking-widest text-vanta-gray font-semibold">Sales</div>
              <div className="text-sm font-mono font-bold text-vanta-navy">+R400.00</div>
            </div>
            <div className="bg-white border border-vanta-border rounded-xl px-4 py-2.5">
              <div className="text-[9px] uppercase tracking-widest text-vanta-gray font-semibold">Stock</div>
              <div className="text-sm font-mono font-bold text-vanta-black">-R180.00</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 bg-vanta-navy text-white rounded-2xl rounded-br-md px-5 py-3.5 text-sm w-fit ml-auto mr-4 sm:mr-[calc(50%+1rem)] max-w-xs"
          >
            how am I doing this month?
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative z-10 bg-white border border-vanta-border rounded-2xl rounded-bl-md px-5 py-3.5 text-sm text-vanta-black w-fit ml-4 sm:ml-[calc(50%+1rem)] max-w-xs"
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

      {/* Honesty — the parts we refuse to fake. Full-bleed, blue accent block. */}
      <section className="relative text-white py-[clamp(4rem,10vh,7rem)] px-6 md:px-12 overflow-hidden bg-vanta-navy">
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
                  'font-serif text-2xl md:text-3xl leading-snug border-t border-white/20 pt-8',
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
      <section className="relative text-white py-[clamp(4rem,10vh,7rem)] px-6 md:px-12 text-center overflow-hidden bg-vanta-navy-dark">
        <motion.div {...fadeUp} className="relative max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif italic tracking-tight leading-tight text-white text-balance">
            The future of bookkeeping is a conversation.
          </h2>
          <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-xl mx-auto font-normal">
            No spreadsheets. No setup fees.
          </p>
          <div className="pt-2">
            <Link
              to="/auth?mode=create"
              className="inline-flex items-center gap-2 bg-white text-vanta-navy px-8 py-4 text-sm font-semibold rounded-full hover:bg-vanta-sidebar transition-all active:scale-[0.98]"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-vanta-border py-12 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-vanta-gray">
          <div>
            <div className="text-2xl font-serif font-bold text-vanta-black mb-1">Vanta</div>
            <div className="text-[11px] text-vanta-gray font-sans">Built for South Africa</div>
          </div>

          <div className="flex items-center gap-8 font-medium">
            <a href="#" className="hover:text-vanta-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-vanta-black transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
