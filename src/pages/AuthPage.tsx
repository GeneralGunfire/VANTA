import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Phone, KeyRound, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'create' ? 'create' : 'signin';

  const [mode, setMode] = useState<'signin' | 'create'>(initialMode);
  const [step, setStep] = useState<'phone' | 'code' | 'business'>('phone');
  const [phone, setPhone] = useState('+27 ');
  const [code, setCode] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('sole_proprietor');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('vanta_auth_status') === 'signed_in') {
      navigate('/app/chat');
    }
  }, [navigate]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 5) return;
    setStep('code');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      setStep('business');
    } else {
      finishAuth();
    }
  };

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    finishAuth();
  };

  // Fake, local-storage-only auth — mirrors the project's disabled real
  // phone-OTP flow structurally (phone -> code -> business name/type) but
  // does not call it or any real backend. See integration report.
  const finishAuth = () => {
    localStorage.setItem('vanta_auth_status', 'signed_in');
    navigate('/app/chat');
  };

  const steps = mode === 'create'
    ? [{ key: 'phone', label: 'Phone number' }, { key: 'code', label: 'Verification code' }, { key: 'business', label: 'Your business' }]
    : [{ key: 'phone', label: 'Phone number' }, { key: 'code', label: 'Verification code' }];
  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="h-dvh w-screen bg-vanta-bg font-sans text-vanta-black flex flex-col lg:flex-row overflow-hidden">
      {/* Left Branding Panel */}
      <div className="lg:w-[42%] p-10 md:p-14 lg:p-16 flex flex-col justify-between relative overflow-hidden text-white">
        {/* Background dissolves to transparent at the seam — a real fade, not a clipped shape */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(155deg, #2E6EBF 0%, #1E5AA8 35%, #153F78 75%, #0F2E58 100%)',
            maskImage: 'linear-gradient(to right, black 0%, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 0%, black 70%, transparent 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(#FFFFFF 1px, transparent 1px)',
            backgroundSize: '18px 18px',
            maskImage: 'linear-gradient(to right, black 0%, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 0%, black 70%, transparent 100%)',
          }}
        />

        {/* Glassy translucent blobs, blended to echo a soft blue gradient field */}
        <div className="pointer-events-none absolute -top-32 -right-16 w-96 h-96 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-[#0F2E58]/50 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 -right-24 -translate-y-1/2 w-72 h-72 rounded-full bg-blue-300/30 blur-3xl" />

        <div className="relative">
          <div
            className="text-2xl font-serif font-bold mb-14 cursor-pointer flex items-center gap-3 group w-fit"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 bg-white/90 backdrop-blur-md border border-white/40 text-vanta-navy flex items-center justify-center font-serif font-bold text-lg rounded-full group-hover:scale-105 transition-transform shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
              V
            </div>
            <span className="tracking-tight">Vanta</span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-serif font-bold mb-5 leading-tight text-white">
            Bookkeeping for the way you actually run your business.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed font-normal">
            Tell Vanta what happened in plain language. It keeps your books and tells you how business is going.
          </p>
        </div>

        <div className="relative space-y-3 mt-10 mr-4 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors',
                  i < stepIndex ? 'bg-white text-vanta-navy' : i === stepIndex ? 'bg-white/20 text-white border border-white/50 backdrop-blur-sm' : 'bg-white/10 text-white/40',
                )}
              >
                {i + 1}
              </span>
              <span className={i === stepIndex ? 'text-white font-semibold' : i < stepIndex ? 'text-white/70' : 'text-white/40'}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form Area */}
      <div className="lg:w-[62%] flex flex-col justify-center p-8 md:p-14 lg:p-20 relative overflow-y-auto">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1/4 hidden lg:block"
          style={{ background: 'linear-gradient(to right, rgba(30,90,168,0.18), transparent)' }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 50% 40% at 100% 0%, rgba(30,90,168,0.06), transparent 70%)',
          }}
        />
        <div className="relative w-full max-w-md mx-auto">
          <div>
            <div className="flex gap-1 bg-vanta-sidebar rounded-full p-1 w-fit mb-10">
              <button
                className={cn(
                  'px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all relative',
                  mode === 'signin' ? 'text-vanta-black' : 'text-vanta-gray hover:text-vanta-black',
                )}
                onClick={() => { setMode('signin'); setStep('phone'); }}
              >
                {mode === 'signin' && (
                  <motion.div layoutId="authTab" className="absolute inset-0 bg-white rounded-full shadow-[0_1px_2px_rgba(28,28,28,0.08)]" />
                )}
                <span className="relative">Sign In</span>
              </button>
              <button
                className={cn(
                  'px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all relative',
                  mode === 'create' ? 'text-vanta-black' : 'text-vanta-gray hover:text-vanta-black',
                )}
                onClick={() => { setMode('create'); setStep('phone'); }}
              >
                {mode === 'create' && (
                  <motion.div layoutId="authTab" className="absolute inset-0 bg-white rounded-full shadow-[0_1px_2px_rgba(28,28,28,0.08)]" />
                )}
                <span className="relative">Create Account</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {step === 'phone' && (
                <motion.div key="phone-step" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <h2 className="text-3xl font-serif font-bold text-vanta-navy mb-3">
                    {mode === 'signin' ? 'Welcome back' : 'Get started'}
                  </h2>
                  <p className="text-vanta-gray text-sm mb-8 leading-relaxed font-medium">
                    {mode === 'signin'
                      ? "We'll send a code to your phone."
                      : "Enter your phone number to begin."}
                  </p>

                  <form onSubmit={handlePhoneSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-vanta-gray mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-vanta-navy" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+27 82 123 4567"
                          required
                          className="w-full text-base font-mono bg-vanta-sidebar border border-transparent rounded-full pl-12 pr-4 py-3.5 focus:outline-none focus:border-vanta-navy focus:bg-white transition-colors text-vanta-black font-semibold"
                        />
                      </div>
                    </div>
                    <button type="submit" className="group w-full bg-vanta-black text-white flex justify-center items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-full hover:bg-vanta-navy transition-all active:scale-[0.98] shadow-sm">
                      <span>Send code</span>
                      <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 'code' && (
                <motion.div key="code-step" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <button onClick={() => setStep('phone')} className="inline-flex items-center gap-1.5 text-xs text-vanta-gray hover:text-vanta-navy mb-6 font-bold uppercase tracking-wider">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <h2 className="text-3xl font-serif font-bold text-vanta-navy mb-3">Enter the code</h2>
                  <p className="text-vanta-gray text-sm mb-8 leading-relaxed font-medium">
                    Enter any 6 digits — this is a placeholder, not a real code yet.
                  </p>

                  <form onSubmit={handleCodeSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-vanta-gray mb-2">
                        Verification Code
                      </label>
                      <div className="relative">
                        <KeyRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-vanta-navy" />
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="123456"
                          required
                          maxLength={6}
                          className="w-full text-lg tracking-[0.3em] font-mono bg-vanta-sidebar border border-transparent rounded-full pl-12 pr-4 py-3.5 focus:outline-none focus:border-vanta-navy focus:bg-white transition-colors text-vanta-black font-semibold"
                        />
                      </div>
                    </div>
                    <button type="submit" className="group w-full bg-vanta-black text-white flex justify-center items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-full hover:bg-vanta-navy transition-all active:scale-[0.98] shadow-sm">
                      <span>{mode === 'create' ? 'Continue' : 'Sign In'}</span>
                      <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 'business' && mode === 'create' && (
                <motion.div key="business-step" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <button onClick={() => setStep('code')} className="inline-flex items-center gap-1.5 text-xs text-vanta-gray hover:text-vanta-navy mb-6 font-bold uppercase tracking-wider">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <h2 className="text-3xl font-serif font-bold text-vanta-navy mb-3">Tell us about your business</h2>
                  <p className="text-vanta-gray text-sm mb-8 leading-relaxed font-medium">
                    This helps Vanta understand your records from day one.
                  </p>

                  <form onSubmit={handleBusinessSubmit} className="space-y-6">
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-vanta-gray mb-2">Business name</label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Nomsa's Bakery"
                          required
                          className="w-full text-base font-semibold bg-vanta-sidebar border border-transparent rounded-full px-5 py-3.5 focus:outline-none focus:border-vanta-navy focus:bg-white transition-colors text-vanta-black"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-vanta-gray mb-2">What kind of business is it?</label>
                        <select
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          required
                          className="w-full text-base font-semibold bg-vanta-sidebar border border-transparent rounded-full px-5 py-3.5 focus:outline-none focus:border-vanta-navy focus:bg-white transition-colors text-vanta-black"
                        >
                          <option value="sole_proprietor">Informal / not yet registered</option>
                          <option value="sole_prop_registered">Sole proprietor (registered)</option>
                          <option value="private_company">Private company (Pty) Ltd</option>
                          <option value="partnership">Partnership</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="group w-full bg-vanta-black text-white flex justify-center items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-full hover:bg-vanta-navy transition-all active:scale-[0.98] shadow-sm">
                      <span>Finish</span>
                      <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-10 flex justify-between text-[10px] uppercase tracking-widest text-vanta-gray font-bold">
            <div>© 2026 Vanta</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-vanta-navy">Privacy</a>
              <a href="#" className="hover:text-vanta-navy">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
