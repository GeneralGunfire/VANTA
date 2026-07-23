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

  return (
    <div className="min-h-screen bg-vanta-bg flex flex-col lg:flex-row font-sans text-vanta-black">
      {/* Left Branding Sidebar */}
      <div className="lg:w-2/5 bg-vanta-sidebar border-r border-vanta-border p-10 md:p-16 lg:p-20 flex flex-col justify-between relative overflow-hidden">
        <div>
          <div
            className="text-3xl font-serif font-bold text-vanta-navy mb-16 cursor-pointer flex items-center gap-3.5 group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-vanta-navy text-white flex items-center justify-center font-serif font-bold text-xl rounded-xs shadow-md group-hover:scale-105 transition-transform">
              V
            </div>
            <span className="tracking-tight">Vanta</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-serif font-bold text-vanta-navy mb-6 leading-tight">
            Bookkeeping for the way you actually run your business.
          </h2>
          <p className="text-vanta-gray text-base leading-relaxed mb-10 font-medium">
            Tell Vanta what happened in plain language. It keeps your books and tells you how business is going.
          </p>

          <div className="bg-white border border-vanta-border p-6 rounded-md shadow-sm space-y-4">
            <div className="text-[10px] uppercase tracking-widest text-vanta-gray font-bold">Progress</div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className={`w-2.5 h-2.5 rounded-full ${step === 'phone' ? 'bg-vanta-navy animate-pulse' : 'bg-vanta-navy'}`} />
              <span className={step === 'phone' ? 'text-vanta-navy font-bold' : 'text-vanta-gray'}>1. Phone number</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className={`w-2.5 h-2.5 rounded-full ${step === 'code' ? 'bg-vanta-navy animate-pulse' : step === 'business' ? 'bg-vanta-navy' : 'bg-vanta-border'}`} />
              <span className={step === 'code' ? 'text-vanta-navy font-bold' : 'text-vanta-gray'}>2. Verification code</span>
            </div>
            {mode === 'create' && (
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className={`w-2.5 h-2.5 rounded-full ${step === 'business' ? 'bg-vanta-navy animate-pulse' : 'bg-vanta-border'}`} />
                <span className={step === 'business' ? 'text-vanta-navy font-bold' : 'text-vanta-gray'}>3. Your business</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="lg:w-3/5 flex flex-col justify-between bg-vanta-bg p-8 md:p-16 lg:p-20">
        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full my-auto">
          <div className="bg-white border border-vanta-border shadow-md rounded-md p-8 md:p-12 space-y-8">
            <div className="flex gap-8 border-b border-vanta-border pb-2">
              <button
                className={cn(
                  'pb-3 text-xs uppercase tracking-widest font-bold transition-all relative',
                  mode === 'signin' ? 'text-vanta-navy' : 'text-vanta-gray hover:text-vanta-navy',
                )}
                onClick={() => { setMode('signin'); setStep('phone'); }}
              >
                Sign In
                {mode === 'signin' && <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-vanta-navy" />}
              </button>
              <button
                className={cn(
                  'pb-3 text-xs uppercase tracking-widest font-bold transition-all relative',
                  mode === 'create' ? 'text-vanta-navy' : 'text-vanta-gray hover:text-vanta-navy',
                )}
                onClick={() => { setMode('create'); setStep('phone'); }}
              >
                Create Account
                {mode === 'create' && <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-vanta-navy" />}
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

                  <form onSubmit={handlePhoneSubmit} className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-vanta-navy mb-3 flex items-center gap-1.5">
                        <Phone size={14} /> Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+27 82 123 4567"
                        required
                        className="w-full text-2xl font-mono border-b-2 border-vanta-border pb-3 focus:outline-none focus:border-vanta-navy transition-colors bg-transparent text-vanta-navy font-bold"
                      />
                    </div>
                    <button type="submit" className="w-full bg-vanta-navy text-white flex justify-between items-center px-6 py-4 text-xs font-bold tracking-widest uppercase hover:bg-opacity-90 transition-all rounded-xs shadow-sm group">
                      <span>Send Code</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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

                  <form onSubmit={handleCodeSubmit} className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-vanta-navy mb-3 flex items-center gap-1.5">
                        <KeyRound size={14} /> Verification Code
                      </label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="123456"
                        required
                        maxLength={6}
                        className="w-full text-4xl tracking-widest font-mono border-b-2 border-vanta-border pb-3 focus:outline-none focus:border-vanta-navy transition-colors bg-transparent text-center text-vanta-navy font-bold"
                      />
                    </div>
                    <button type="submit" className="w-full bg-vanta-navy text-white flex justify-between items-center px-6 py-4 text-xs font-bold tracking-widest uppercase hover:bg-opacity-90 transition-all rounded-xs shadow-sm group">
                      <span>{mode === 'create' ? 'Continue' : 'Sign In'}</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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

                  <form onSubmit={handleBusinessSubmit} className="space-y-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-vanta-navy mb-2">Business name</label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Nomsa's Bakery"
                          required
                          className="w-full text-lg border-b-2 border-vanta-border pb-2 focus:outline-none focus:border-vanta-navy transition-colors bg-transparent text-vanta-navy font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-vanta-navy mb-2">What kind of business is it?</label>
                        <select
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          required
                          className="w-full text-base font-semibold border-b-2 border-vanta-border pb-2 focus:outline-none focus:border-vanta-navy transition-colors bg-transparent text-vanta-navy"
                        >
                          <option value="sole_proprietor">Informal / not yet registered</option>
                          <option value="sole_prop_registered">Sole proprietor (registered)</option>
                          <option value="private_company">Private company (Pty) Ltd</option>
                          <option value="partnership">Partnership</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-vanta-navy text-white flex justify-between items-center px-6 py-4 text-xs font-bold tracking-widest uppercase hover:bg-opacity-90 transition-all rounded-xs shadow-sm group">
                      <span>Finish</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="pt-12 flex justify-between text-[10px] uppercase tracking-widest text-vanta-gray font-bold max-w-lg mx-auto w-full">
          <div>© 2024 Vanta</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-vanta-navy">Privacy</a>
            <a href="#" className="hover:text-vanta-navy">Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
}
