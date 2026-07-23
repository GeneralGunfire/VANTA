import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('vanta_auth_status') === 'signed_in') {
      navigate('/app/chat');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-vanta-bg text-vanta-black font-sans antialiased selection:bg-vanta-navy selection:text-white">
      <header className="border-b border-vanta-border bg-vanta-bg/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
          <Link to="/" className="text-2xl font-serif font-bold text-vanta-navy tracking-tight">
            Vanta
          </Link>

          <nav className="hidden md:flex items-center gap-10 text-xs font-bold text-vanta-gray tracking-wide uppercase">
            <a href="#product" className="text-vanta-navy font-bold border-b-2 border-vanta-navy pb-1">
              Product
            </a>
            <Link to="/auth" className="hover:text-vanta-navy transition-colors">
              Ledger
            </Link>
          </nav>

          <Link
            to="/auth"
            className="bg-vanta-navy text-white px-5 py-2.5 text-xs font-bold tracking-wider uppercase hover:bg-opacity-90 transition-all rounded-xs shadow-xs"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="lg:col-span-7 space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-vanta-navy tracking-tight leading-[1.06] font-bold">
              Bookkeeping for the way you actually run your business.
            </h1>

            <p className="text-vanta-gray text-base md:text-lg leading-relaxed max-w-xl font-medium">
              Tell Vanta what happened in plain language. It keeps your books and tells you how business is going — no spreadsheets, no charts, no jargon.
            </p>

            <div className="flex items-center gap-6 pt-2">
              <Link
                to="/auth?mode=create"
                className="bg-vanta-navy text-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all rounded-xs shadow-sm"
              >
                Get started
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="bg-white border border-vanta-border p-6 rounded-md shadow-sm space-y-4">
              <div className="text-[9px] font-mono uppercase tracking-widest text-vanta-gray font-semibold">Example</div>
              <div className="bg-vanta-sidebar border-l-2 border-vanta-navy p-4">
                <p className="text-sm italic text-vanta-gray leading-relaxed">"sold 20 loaves R400 cash"</p>
              </div>
              <div className="flex justify-center text-vanta-gray">
                <ArrowDown size={18} />
              </div>
              <div className="bg-vanta-bg p-4 border border-vanta-border rounded-xs flex justify-between items-center">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-vanta-gray font-semibold mb-1">Category</div>
                  <div className="text-sm font-bold text-vanta-navy">Sales</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-widest text-vanta-gray font-semibold mb-1">Amount</div>
                  <div className="text-lg font-mono font-bold text-vanta-navy">+R400.00</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <hr className="border-vanta-border" />
      </div>

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
