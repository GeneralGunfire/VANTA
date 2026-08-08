import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, AlertTriangle, ArrowDownLeft, ArrowUpRight, Package, Home, Zap, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { VantaLogo } from '../components/VantaLogo';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

const NAV_LINKS = [
  { id: 'product', label: 'How it works' },
  { id: 'demo', label: 'See it in action' },
  { id: 'faq', label: 'FAQ' },
];

/**
 * The one recurring visual device on the page — real Vanta UI in a plain
 * software window, never a photo or generated graphic. Every section that
 * needs to "show" the product reuses this exact chrome so the page reads
 * as one product, not a set of illustrations.
 */
function ProductWindow({ children, className, highlighted }: { children: React.ReactNode; className?: string; highlighted?: boolean }) {
  return (
    <div
      className={cn('rounded-2xl border border-vanta-navy/15 bg-white overflow-hidden', className)}
      style={{
        boxShadow: highlighted
          ? '0 2px 4px rgba(17,24,39,0.10), 0 28px 60px -14px rgba(17,24,39,0.32), 0 0 0 4px rgba(18,97,232,0.18), 0 0 70px -10px rgba(10,147,253,0.55)'
          : '0 2px 4px rgba(17,24,39,0.10), 0 28px 60px -14px rgba(17,24,39,0.28)',
      }}
    >
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-vanta-border bg-vanta-sidebar">
        <span className="w-2 h-2 rounded-full bg-vanta-border" />
        <span className="w-2 h-2 rounded-full bg-vanta-border" />
        <span className="w-2 h-2 rounded-full bg-vanta-border" />
      </div>
      {children}
    </div>
  );
}

/**
 * A feature panel: light gray outer frame, small eyebrow, bold heading
 * paired with a circular arrow, and a nested white product card inset
 * with visible gray margin around it — a different rhythm from the plain
 * statement sections and bare ProductWindow demos elsewhere on the page.
 */
function FeaturePanel({ eyebrow, heading, delay, children }: { eyebrow: string; heading: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay }}
      className="rounded-2xl bg-vanta-bg p-6 md:p-7"
    >
      <div className="text-[13px] text-vanta-gray mb-2">{eyebrow}</div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-vanta-black tracking-tight leading-snug">{heading}</h3>
        <span className="w-9 h-9 rounded-full bg-vanta-black text-white flex items-center justify-center shrink-0">
          <ArrowRight size={15} />
        </span>
      </div>
      <div className="rounded-2xl border border-vanta-navy/15 bg-white overflow-hidden" style={{ boxShadow: '0 2px 4px rgba(17,24,39,0.08), 0 20px 44px -16px rgba(17,24,39,0.20)' }}>
        {children}
      </div>
    </motion.div>
  );
}

/**
 * The "You" side of a demo exchange, styled as an actual speech bubble —
 * a deliberate exception to the real in-app Chat page (which was
 * redesigned earlier to drop bubbles entirely). Marketing mockups get to
 * read more visually than the product itself.
 */
function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[11px] font-medium text-vanta-gray-light">You</span>
      <p className="inline-block bg-vanta-navy text-white text-[15px] leading-relaxed rounded-2xl rounded-br-md px-4 py-2.5 max-w-md text-left">
        {children}
      </p>
    </div>
  );
}

/** Reveals one message/turn in a demo conversation on its own beat, so a multi-turn exchange plays out rather than appearing all at once. */
function ConversationTurn({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** A single ledger-style line — the same category/amount row used throughout the real app. */
function LedgerLine({ label, amount, direction }: { label: string; amount: string; direction: 'in' | 'out' }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[13px] text-vanta-black">{label}</span>
      <span className="font-mono text-[13px] font-medium text-vanta-black flex items-center gap-1">
        {direction === 'in' ? <ArrowDownLeft size={12} className="text-vanta-success" /> : <ArrowUpRight size={12} className="text-vanta-gray" />}
        {amount}
      </span>
    </div>
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
    <div className="relative min-h-screen w-full overflow-x-hidden bg-white text-vanta-black font-sans antialiased selection:bg-vanta-navy selection:text-white [text-rendering:optimizeLegibility]">
      <div className="sticky top-0 z-50 px-4 pt-4 md:px-6">
        <header className="max-w-5xl mx-auto rounded-full border border-vanta-border bg-white/90 backdrop-blur-xl shadow-[0_4px_16px_-10px_rgba(17,24,39,0.15)]">
          <div className="px-3.5 md:px-5 py-2 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 pl-1">
              <VantaLogo size={26} className="shrink-0" />
              <span className="text-[15px] font-semibold text-vanta-black tracking-tight">Vanta</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium text-vanta-gray bg-vanta-sidebar rounded-full p-1">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={() => setActiveSection(link.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'relative px-3.5 py-1.5 rounded-full transition-colors',
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
              className="bg-vanta-navy text-white px-4 py-2 text-[13px] font-medium rounded-lg hover:bg-vanta-navy-dark transition-colors duration-150 active:scale-[0.98]"
            >
              Sign in
            </Link>
          </div>
        </header>
      </div>

      {/* ================= HERO — the one deliberate dark-blue surface on the
          page (matches the closing CTA bookend further down). Everything
          else on the page stays light; blue elsewhere is an accent only. ================= */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, var(--brand-hero-bg-dark) 0%, var(--brand-navy-deep) 60%, var(--brand-blue-mid) 130%)' }}
      >
        {/* Soft diagonal light streaks — CSS only, no image asset. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -right-40 top-0 w-175 h-175 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--brand-blue-bright) 0%, transparent 65%)' }}
          />
          <div
            className="absolute right-0 bottom-0 w-300 h-60 opacity-25"
            style={{
              background: 'repeating-linear-gradient(115deg, transparent 0px, transparent 38px, rgba(255,255,255,0.5) 39px, transparent 41px)',
              maskImage: 'radial-gradient(ellipse 70% 100% at 100% 100%, black 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 md:px-12 pt-16 pb-28 md:pt-20 md:pb-36 text-center">
          {/* A row of the real transaction categories, not illustrated
              characters — true to what Vanta actually organizes, and kept to
              one hue family per the single-accent rule. A gentle stagger
              keeps it from reading as a lifted copy of any single reference. */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-end justify-center gap-4 mb-9"
          >
            {[
              { icon: ArrowDownLeft, label: 'Sales', offset: '0' },
              { icon: Package, label: 'Stock', offset: '-mb-2' },
              { icon: Home, label: 'Rent', offset: '0' },
              { icon: Zap, label: 'Utilities', offset: '-mb-2' },
              { icon: Users, label: 'Wages', offset: '0' },
            ].map(({ icon: Icon, label, offset }) => (
              <span
                key={label}
                title={label}
                className={cn('w-14 h-14 rounded-full bg-white border border-vanta-border flex items-center justify-center text-vanta-navy', offset)}
                style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.04), 0 6px 16px rgba(17,24,39,0.05)' }}
              >
                <Icon size={22} />
              </span>
            ))}
          </motion.div>

          {/* Deliberate line breaks at natural clause boundaries — never left
              to wrap unpredictably — with one phrase carried in a highlight
              pill, the one recurring accent-color move on the page. */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="font-bold tracking-[-0.03em] leading-[1.05] text-[clamp(2.5rem,4.6vw+0.8rem,4.25rem)] text-white"
          >
            <span className="block">Bookkeeping for the way</span>
            <span className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
              <span>you</span>
              <span className="inline-flex items-center gap-2 bg-vanta-accent-tint text-vanta-navy rounded-full px-4 md:px-5">
                <span className="w-2 h-2 rounded-full bg-vanta-navy shrink-0" />
                actually run
              </span>
              <span>your business.</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="text-white/70 text-lg leading-relaxed max-w-md mx-auto mt-8"
          >
            Describe what happened, and Vanta keeps the books — no spreadsheets, no dashboards, no jargon.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-9"
          >
            <Link
              to="/auth?mode=create"
              className="group inline-flex items-center gap-2 bg-white text-vanta-navy px-6 py-3 text-[14px] font-medium rounded-lg hover:bg-vanta-sidebar transition-colors duration-150 active:scale-[0.98]"
            >
              Get started
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3 text-[14px] font-medium rounded-lg hover:bg-white/15 transition-colors duration-150 active:scale-[0.98]"
            >
              See it in action
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-7 text-[12px] text-white/50 font-medium"
          >
            <span>No spreadsheets</span>
            <span aria-hidden="true">·</span>
            <span>No setup fees</span>
            <span aria-hidden="true">·</span>
            <span>Built for South Africa</span>
          </motion.div>
        </div>
      </section>

      {/* ============ PRODUCT VISUAL — the real Chat UI, on the page's normal
          white background (deliberately not inside the dark hero — no blue
          touching the card on any side). ============ */}
      <section className="bg-white">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-4xl mx-auto px-6 md:px-12 pt-16 md:pt-20 pb-8 md:pb-10"
        >
          <ProductWindow>
            <div className="p-6 md:p-9 space-y-6">
              <ConversationTurn delay={0.1}>
                <UserBubble>sold 20 loaves for R400 cash</UserBubble>
              </ConversationTurn>
              <ConversationTurn delay={0.55}>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-vanta-gray-light">Vanta</span>
                  <p className="text-[15px] text-vanta-black leading-relaxed">Got it — recorded R400 in cash sales.</p>
                  <div className="border-t border-vanta-border mt-2 pt-2 max-w-55">
                    <LedgerLine label="Sales" amount="+R400.00" direction="in" />
                  </div>
                </div>
              </ConversationTurn>
            </div>
          </ProductWindow>
        </motion.div>
      </section>

      {/* ================= "Just tell Vanta what happened." — huge statement, minimal support ================= */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 py-[clamp(4rem,10vh,7rem)] text-center border-t border-vanta-border">
        <motion.p
          {...fadeUp}
          className="font-semibold text-[clamp(2rem,3.6vw+0.8rem,3.25rem)] leading-[1.12] tracking-[-0.015em] text-vanta-black text-balance"
        >
          Just tell Vanta what happened.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-vanta-gray text-base leading-relaxed max-w-sm mx-auto mt-5"
        >
          No forms. No categories to pick. Say it the way you'd tell a friend.
        </motion.p>
      </section>

      {/* ================= Conversational demonstration — precise heading, real UI mockup ================= */}
      <section id="demo" className="max-w-4xl mx-auto px-6 md:px-12 py-[clamp(3.5rem,8vh,5.5rem)] border-t border-vanta-border">
        <motion.div {...fadeUp} className="mb-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-vanta-navy mb-3">See it in action</div>
          <h2 className="text-2xl md:text-3xl font-semibold text-vanta-black tracking-tight leading-snug max-w-md">
            One message in. A clean record out.
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5 }}>
          <ProductWindow>
            <div className="p-6 md:p-9 space-y-6">
              <ConversationTurn delay={0}>
                <UserBubble>paid R850 for electricity, got a R2,000 deposit from a customer</UserBubble>
              </ConversationTurn>
              <ConversationTurn delay={0.4}>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-vanta-gray-light">Vanta</span>
                  <p className="text-[15px] text-vanta-black leading-relaxed">Got it — here's what I recorded.</p>
                  <div className="border-t border-vanta-border mt-2 pt-2 space-y-1.5 max-w-55">
                    <LedgerLine label="Utilities" amount="-R850.00" direction="out" />
                    <LedgerLine label="Deposit" amount="+R2,000.00" direction="in" />
                  </div>
                </div>
              </ConversationTurn>
              <ConversationTurn delay={0.85}>
                <UserBubble>how am I doing this month?</UserBubble>
              </ConversationTurn>
              <ConversationTurn delay={1.2}>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-vanta-gray-light">Vanta</span>
                  <p className="text-[15px] text-vanta-black leading-relaxed">You made R2,340 more than you spent — and one record still needs your review.</p>
                </div>
              </ConversationTurn>
            </div>
          </ProductWindow>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-xs text-vanta-gray-light text-center mt-8"
        >
          Your original words are kept on file, always — never edited away.
        </motion.p>
      </section>

      {/* ================= "Vanta handles the bookkeeping underneath." — second bookend statement ================= */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 py-[clamp(4rem,10vh,7rem)] text-center border-t border-vanta-border">
        <motion.p
          {...fadeUp}
          className="font-semibold text-[clamp(2rem,3.6vw+0.8rem,3.25rem)] leading-[1.12] tracking-[-0.015em] text-vanta-black text-balance"
        >
          Vanta handles the <span className="text-vanta-navy">bookkeeping</span> underneath.
        </motion.p>
      </section>

      {/* ================= Two feature panels, side by side — outer gray frame, nested white product card, eyebrow + bold heading + arrow ================= */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-[clamp(3.5rem,8vh,5.5rem)] border-t border-vanta-border">
        <div className="grid md:grid-cols-2 gap-8">
          <FeaturePanel eyebrow="Understand" heading="From your words to a real ledger entry." delay={0}>
            <div className="p-5 space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray-light font-medium mb-1.5">You say</div>
                <p className="text-[13px] text-vanta-black font-mono">"sold 20 loaves R400 cash"</p>
              </div>
              <div className="border-t border-vanta-border pt-3">
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray-light font-medium mb-1.5">Vanta understands</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] font-medium text-vanta-navy bg-vanta-accent-tint px-2.5 py-1 rounded-full">Sales</span>
                  <span className="text-[11px] font-medium text-vanta-gray bg-vanta-sidebar border border-vanta-border px-2.5 py-1 rounded-full">Cash</span>
                  <span className="text-[11px] font-mono font-medium text-vanta-black bg-vanta-sidebar border border-vanta-border px-2.5 py-1 rounded-full">R400.00</span>
                </div>
              </div>
              <div className="border-t border-vanta-border pt-3">
                <div className="text-[10px] uppercase tracking-widest text-vanta-gray-light font-medium mb-1.5">Your ledger</div>
                <LedgerLine label="Sales — 20 loaves, cash" amount="+R400.00" direction="in" />
              </div>
            </div>
          </FeaturePanel>

          <FeaturePanel eyebrow="Ask anything" heading="Get a real answer, with the numbers behind it." delay={0.08}>
            <div className="p-5">
              <div className="text-[12px] text-vanta-gray-light mb-2">How am I doing this month?</div>
              <p className="text-[15px] font-medium text-vanta-black leading-relaxed">You've made R8,420 in sales this month — R1,180 more than last month.</p>
              <p className="text-[12px] text-vanta-gray mt-2">Based on 31 confirmed transactions this month.</p>
            </div>
          </FeaturePanel>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-xs text-vanta-gray-light text-center mt-10 max-w-sm mx-auto leading-relaxed"
        >
          Every figure is real arithmetic on your own recorded data — never a guess dressed up as a number.
        </motion.p>
      </section>

      {/* ================= Supporting features — real cards with a subtle shadow, filling the section rather than floating loose text ================= */}
      <section id="product" className="max-w-5xl mx-auto px-6 md:px-12 py-[clamp(3.5rem,8vh,5.5rem)] border-t border-vanta-border">
        <motion.div {...fadeUp} className="mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-vanta-black tracking-tight">A few more things worth knowing.</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {[
            {
              title: 'Never guesses silently',
              body: 'If Vanta isn’t sure, it flags it for you to confirm — and remembers your correction.',
              mock: (
                <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-vanta-warning bg-white border border-vanta-warning/40 rounded-full px-3 py-1.5">
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
              body: 'Made for small, informal businesses first — spaza shops, side hustles, sole proprietors.',
              mock: (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-vanta-black bg-vanta-sidebar border border-vanta-border rounded-full px-3 py-2">
                  🇿🇦 Registered or not
                </div>
              ),
            },
            {
              title: 'Nothing is fabricated',
              body: "If a number can't be shown honestly, Vanta says so instead of guessing.",
              mock: (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-vanta-black bg-vanta-sidebar border border-vanta-border rounded-full px-3 py-2">
                  Real data only
                </div>
              ),
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-vanta-navy/15 bg-white p-6 md:p-7 space-y-3"
              style={{ boxShadow: '0 2px 4px rgba(17,24,39,0.08), 0 20px 44px -16px rgba(17,24,39,0.22)' }}
            >
              <h3 className="font-semibold text-vanta-black text-base">{f.title}</h3>
              <p className="text-vanta-gray text-sm leading-relaxed">{f.body}</p>
              {f.mock}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="max-w-4xl mx-auto px-6 md:px-12 py-[clamp(3.5rem,8vh,5.5rem)] border-t border-vanta-border">
        <motion.div {...fadeUp} className="mb-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-vanta-navy mb-3">Questions</div>
          <h2 className="text-2xl md:text-3xl font-semibold text-vanta-black tracking-tight">
            Good to know
          </h2>
        </motion.div>

        <div>
          {[
            {
              q: 'Do I need to know accounting to use Vanta?',
              a: "No. Describe what happened the way you'd tell a friend — Vanta handles the categorizing and the bookkeeping terms.",
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
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="grid grid-cols-[3rem_1fr] md:grid-cols-[4rem_1fr_1fr] gap-x-4 gap-y-2 py-7 border-t border-vanta-border"
            >
              <div className="text-2xl text-vanta-border font-semibold">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="font-semibold text-vanta-black text-base md:col-start-2">{item.q}</div>
              <div className="text-vanta-gray text-sm leading-relaxed max-w-[42ch] col-start-2 md:col-start-3 md:row-start-1">{item.a}</div>
            </motion.div>
          ))}
          <div className="border-t border-vanta-border" />
        </div>
      </section>

      {/* ================= Final CTA — the one deliberate dark-blue bookend on the page ================= */}
      <section className="px-6 md:px-12 py-[clamp(4rem,10vh,7rem)] border-t border-vanta-border">
        <motion.div
          {...fadeUp}
          className="relative max-w-4xl mx-auto text-center rounded-2xl overflow-hidden px-8 py-16 md:py-20"
          style={{ background: 'linear-gradient(135deg, var(--brand-hero-bg-dark) 0%, var(--brand-navy-deep) 55%, var(--brand-blue-mid) 100%)' }}
        >
          <div className="relative">
            <h2 className="text-[clamp(1.75rem,3.2vw+0.6rem,2.75rem)] font-semibold tracking-[-0.015em] leading-[1.12] text-white text-balance mb-5">
              The future of bookkeeping is a conversation.
            </h2>
            <p className="text-white/70 text-base leading-relaxed max-w-xs mx-auto mb-9">
              No credit card. No learning curve.
            </p>
            <Link
              to="/auth?mode=create"
              className="inline-flex items-center gap-2 bg-white text-vanta-navy px-7 py-3.5 text-[14px] font-medium rounded-lg hover:bg-vanta-sidebar transition-colors duration-150 active:scale-[0.98]"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-vanta-border py-12 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-vanta-gray">
          <div className="flex items-center gap-3">
            <VantaLogo size={32} className="shrink-0" />
            <div>
              <div className="text-lg font-semibold text-vanta-black leading-none mb-1 tracking-tight">Vanta</div>
              <div className="text-[11px] text-vanta-gray-light">Built for South Africa</div>
            </div>
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
