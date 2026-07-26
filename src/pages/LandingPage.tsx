import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowDown, PlayCircle, Plus, MessageCircle, ShieldCheck, Upload } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('vanta_auth_status') === 'signed_in') {
      navigate('/app/chat');
    }
  }, [navigate]);

  return (
    <div className="relative min-h-screen bg-vanta-bg text-vanta-black font-sans antialiased selection:bg-vanta-navy selection:text-white">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, #E6E6E8 0px, #E6E6E8 1px, transparent 1px, transparent 140px)',
          maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 85%)',
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
              <Link to="/auth" className="px-4 py-1.5 rounded-full hover:text-vanta-black transition-colors">
                Ledger
              </Link>
              <a href="#pricing" className="px-4 py-1.5 rounded-full hover:text-vanta-black transition-colors">
                Pricing
              </a>
            </nav>

            <Link
              to="/auth"
              className="bg-vanta-black text-white px-5 py-2 text-sm font-semibold rounded-full hover:bg-vanta-navy transition-colors active:scale-[0.97]"
            >
              Sign in
            </Link>
          </div>
        </header>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 55% 45% at 50% 0%, rgba(30,90,168,0.07), transparent 72%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '26px 26px',
            color: '#E6E6E8',
            maskImage: 'radial-gradient(ellipse 65% 50% at 50% 15%, black 25%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 65% 50% at 50% 15%, black 25%, transparent 85%)',
          }}
        />

        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <div className="relative max-w-5xl mx-auto h-full">
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

        <div className="relative max-w-5xl mx-auto px-6 md:px-12 pt-20 md:pt-28 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
            <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-vanta-border bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-vanta-navy mb-8 shadow-[0_1px_2px_rgba(28,28,28,0.04)]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-vanta-navy" />
                Bookkeeping, in plain language
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="font-serif font-bold tracking-[-0.02em] leading-[1.06] text-[2.75rem] sm:text-5xl lg:text-[3.4rem] text-vanta-black text-balance"
              >
                Every sale, every expense,{' '}
                <span className="relative inline-block text-vanta-navy">
                  one conversation.
                  <svg
                    className="absolute left-0 -bottom-1.5 w-full h-2.5"
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
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-vanta-gray text-base md:text-lg leading-relaxed max-w-lg mt-7 font-normal text-balance"
              >
                Tell Vanta what happened in plain language. It keeps clean records and tells you how business is going — no spreadsheets, no charts, no jargon.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-10"
              >
                <Link
                  to="/auth?mode=create"
                  className="group inline-flex items-center gap-2 bg-vanta-black text-white px-7 py-3.5 text-sm font-semibold rounded-full hover:bg-vanta-navy transition-all shadow-[0_1px_2px_rgba(28,28,28,0.06),0_12px_24px_-8px_rgba(28,28,28,0.25)] active:scale-[0.98]"
                >
                  Get started
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#product"
                  className="inline-flex items-center gap-2 border border-vanta-border bg-white px-7 py-3.5 text-sm font-semibold text-vanta-black rounded-full hover:border-vanta-navy hover:text-vanta-navy transition-all active:scale-[0.98]"
                >
                  <PlayCircle size={16} />
                  See how it works
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1 mt-7 text-xs font-semibold text-vanta-gray"
              >
                <span>No spreadsheets</span>
                <span className="w-1 h-1 rounded-full bg-vanta-border" />
                <span>No setup fees</span>
                <span className="w-1 h-1 rounded-full bg-vanta-border" />
                <span>Built for South Africa</span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="lg:col-span-5 w-full max-w-md mx-auto"
            >
              <div className="bg-white border border-vanta-border p-6 rounded-3xl shadow-[0_30px_70px_-30px_rgba(28,28,28,0.22)] space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-vanta-gray font-semibold">
                    You say
                  </span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-vanta-border" />
                    <span className="w-1.5 h-1.5 rounded-full bg-vanta-border" />
                    <span className="w-1.5 h-1.5 rounded-full bg-vanta-border" />
                  </span>
                </div>
                <div className="bg-vanta-sidebar rounded-2xl p-4">
                  <p className="text-sm text-vanta-black leading-relaxed">"sold 20 loaves R400 cash"</p>
                </div>
                <div className="flex justify-center text-vanta-gray">
                  <ArrowDown size={16} />
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-vanta-gray font-semibold">
                  Vanta records
                </div>
                <div className="p-4 border border-vanta-border rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-vanta-gray font-semibold mb-1">Category</div>
                    <div className="text-sm font-bold text-vanta-black">Sales</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-vanta-gray font-semibold mb-1">Amount</div>
                    <div className="text-lg font-mono font-bold text-vanta-navy">+R400.00</div>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-3 gap-3 mt-6"
              >
                {[
                  { icon: MessageCircle, title: 'Talk, don’t type' },
                  { icon: ShieldCheck, title: 'Never guesses' },
                  { icon: Upload, title: 'Upload files' },
                ].map((f) => (
                  <div key={f.title} className="flex flex-col items-center text-center gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-vanta-sidebar border border-vanta-border flex items-center justify-center shrink-0 text-vanta-navy">
                      <f.icon size={15} />
                    </div>
                    <div className="text-[11px] font-semibold text-vanta-black leading-tight">{f.title}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section: how it works */}
      <section id="product" className="max-w-6xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-vanta-navy leading-tight">
              Talk, don't type
            </h2>
            <p className="text-vanta-gray text-sm md:text-base leading-relaxed">
              Describe a sale or expense the way you'd tell a friend. Vanta turns it into a clean, structured record — and asks if it isn't sure, rather than guessing silently.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: 'Plain-English answers', body: 'No dashboards or charts. Ask "how am I doing?" and get a real sentence back.' },
              { title: 'Never guesses silently', body: 'If Vanta isn’t sure, it flags it for you to confirm — and remembers your correction.' },
              { title: 'Upload what you have', body: 'Excel or CSV records work too — not just typing.' },
              { title: 'Built for South Africa', body: 'Made for small, informal businesses first.' },
            ].map((f) => (
              <div key={f.title} className="bg-white border border-vanta-border p-6 rounded-xs shadow-xs">
                <h3 className="font-bold text-vanta-navy text-sm mb-2">{f.title}</h3>
                <p className="text-vanta-gray text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-vanta-navy text-white py-24 px-6 md:px-12 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif italic tracking-tight leading-tight text-white">
            The future of bookkeeping is a conversation.
          </h2>
          <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-xl mx-auto font-normal">
            No spreadsheets. No setup fees.
          </p>
          <div className="pt-2">
            <Link
              to="/auth?mode=create"
              className="inline-block bg-white text-vanta-navy px-8 py-4 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-all rounded-xs shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
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
