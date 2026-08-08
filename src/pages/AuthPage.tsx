import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';
import { VantaLogo } from '../components/VantaLogo';

const OTP_LENGTH = 6;

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'create' ? 'create' : 'signin';

  const [mode, setMode] = useState<'signin' | 'create'>(initialMode);
  const [step, setStep] = useState<'phone' | 'code' | 'business'>('phone');
  const [phone, setPhone] = useState('');
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
    if (phone.trim().length < 5) return;
    setStep('code');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fake flow — any entered digits verify, no need to fill all 6 boxes.
    if (code.trim().length === 0) return;
    if (mode === 'create') {
      setStep('business');
    } else {
      finishAuth();
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Persist the business name/type collected here so Business Profile
    // and Tax Calendar have real data from day one, instead of a second,
    // disconnected place to enter the same facts later. Best-effort: a
    // failed write shouldn't block sign-up, since the Business Profile
    // page lets the owner fill this in afterward either way.
    if (supabase) {
      try {
        await supabase.from('business_profile').upsert(
          { anon_id: getAnonId(), business_name: businessName, business_type: businessType },
          { onConflict: 'anon_id' },
        );
      } catch (err) {
        console.error('Error saving business profile during sign-up:', err);
      }
    }
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
    <div className="min-h-dvh w-full bg-vanta-bg flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-130">
        {/* Brand anchor — bigger than before, still never dominant */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 mx-auto mb-8 group w-fit"
        >
          <VantaLogo size={36} className="shrink-0 group-hover:opacity-80 transition-opacity" />
          <span className="text-[17px] font-semibold tracking-tight text-vanta-black">Vanta</span>
        </button>

        {/* The form itself lives inside an elevated card, not floating loose on the canvas */}
        <div className="bg-white border border-vanta-border rounded-2xl p-8 md:p-11" style={{ boxShadow: '0 2px 4px rgba(17,24,39,0.06), 0 24px 56px -20px rgba(17,24,39,0.18)' }}>
          {/* Sign in / Create account — a quiet segmented control, not a pill tab */}
          <div className="flex items-center gap-1 bg-vanta-sidebar border border-vanta-border rounded-lg p-1 w-fit mx-auto mb-9">
            <button
              className={cn(
                'relative px-5 py-2 text-[13px] font-medium rounded-md transition-colors duration-150',
                mode === 'signin' ? 'text-vanta-black' : 'text-vanta-gray hover:text-vanta-black',
              )}
              onClick={() => { setMode('signin'); setStep('phone'); }}
            >
              {mode === 'signin' && (
                <motion.div layoutId="authTab" transition={{ duration: 0.18 }} className="absolute inset-0 bg-white border border-vanta-border rounded-md" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.04)' }} />
              )}
              <span className="relative">Sign in</span>
            </button>
            <button
              className={cn(
                'relative px-5 py-2 text-[13px] font-medium rounded-md transition-colors duration-150',
                mode === 'create' ? 'text-vanta-black' : 'text-vanta-gray hover:text-vanta-black',
              )}
              onClick={() => { setMode('create'); setStep('phone'); }}
            >
              {mode === 'create' && (
                <motion.div layoutId="authTab" transition={{ duration: 0.18 }} className="absolute inset-0 bg-white border border-vanta-border rounded-md" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.04)' }} />
              )}
              <span className="relative">Create account</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 'phone' && (
              <motion.div key="phone-step" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="text-center">
                <h1 className="text-[36px] font-semibold tracking-tight text-vanta-black mb-2.5 leading-tight">
                  {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="text-[15px] text-vanta-gray mb-9">
                  {mode === 'signin' ? 'Sign in to continue to your business.' : "We'll text you a code to get started."}
                </p>

                <form onSubmit={handlePhoneSubmit} className="space-y-5 text-left">
                  <div>
                    <label className="block text-[12px] font-medium text-vanta-gray mb-2">Phone number</label>
                    <div className="flex items-center rounded-xl border border-vanta-border bg-white transition-colors duration-150 focus-within:border-vanta-navy/50 focus-within:ring-2 focus-within:ring-vanta-navy/15">
                      <span className="pl-4 pr-2 py-4 text-[16px] font-mono text-vanta-gray select-none border-r border-vanta-border">+27</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="82 123 4567"
                        required
                        autoFocus
                        className="w-full bg-transparent px-4 py-4 text-[16px] font-mono text-vanta-black placeholder:text-vanta-gray-light focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="group w-full bg-vanta-navy text-white flex justify-center items-center gap-2 px-5 py-4 text-[15px] font-medium rounded-xl hover:bg-vanta-navy-dark transition-colors duration-150 active:scale-[0.99]"
                  >
                    <span>Continue</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'code' && (
              <motion.div key="code-step" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="text-center">
                <button onClick={() => setStep('phone')} className="inline-flex items-center gap-1.5 text-[12px] text-vanta-gray hover:text-vanta-black mb-7 font-medium transition-colors">
                  <ArrowLeft size={13} /> Back
                </button>
                <h1 className="text-[36px] font-semibold tracking-tight text-vanta-black mb-2.5 leading-tight">Verify your number</h1>
                <p className="text-[15px] text-vanta-gray mb-9">We sent a verification code to your phone.</p>

                <form onSubmit={handleCodeSubmit} className="space-y-6">
                  <OtpInput value={code} onChange={setCode} />
                  <button
                    type="submit"
                    disabled={code.trim().length === 0}
                    className="group w-full bg-vanta-navy text-white flex justify-center items-center gap-2 px-5 py-4 text-[15px] font-medium rounded-xl hover:bg-vanta-navy-dark transition-colors duration-150 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span>Verify</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>

                <p className="text-[13px] text-vanta-gray mt-7">
                  Didn't receive a code?{' '}
                  <button
                    type="button"
                    onClick={() => toast.success('New code sent')}
                    className="text-vanta-navy font-medium hover:text-vanta-navy-dark transition-colors"
                  >
                    Resend code
                  </button>
                </p>
              </motion.div>
            )}

            {step === 'business' && mode === 'create' && (
              <motion.div key="business-step" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="text-center">
                <button onClick={() => setStep('code')} className="inline-flex items-center gap-1.5 text-[12px] text-vanta-gray hover:text-vanta-black mb-7 font-medium transition-colors">
                  <ArrowLeft size={13} /> Back
                </button>
                <h1 className="text-[36px] font-semibold tracking-tight text-vanta-black mb-2.5 leading-tight">Tell us about your business</h1>
                <p className="text-[15px] text-vanta-gray mb-9">This helps Vanta understand your records from day one.</p>

                <form onSubmit={handleBusinessSubmit} className="space-y-5 text-left">
                  <div>
                    <label className="block text-[12px] font-medium text-vanta-gray mb-2">Business name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Nomsa's Bakery"
                      required
                      autoFocus
                      className="w-full text-[16px] bg-white border border-vanta-border rounded-xl px-4 py-4 focus:outline-none focus:border-vanta-navy/50 focus:ring-2 focus:ring-vanta-navy/15 transition-colors duration-150 text-vanta-black placeholder:text-vanta-gray-light"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-vanta-gray mb-2">What kind of business is it?</label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      required
                      className="w-full text-[16px] bg-white border border-vanta-border rounded-xl px-4 py-4 focus:outline-none focus:border-vanta-navy/50 focus:ring-2 focus:ring-vanta-navy/15 transition-colors duration-150 text-vanta-black"
                    >
                      <option value="sole_proprietor">Informal / not yet registered</option>
                      <option value="sole_prop_registered">Sole proprietor (registered)</option>
                      <option value="private_company">Private company (Pty) Ltd</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="group w-full bg-vanta-navy text-white flex justify-center items-center gap-2 px-5 py-4 text-[15px] font-medium rounded-xl hover:bg-vanta-navy-dark transition-colors duration-150 active:scale-[0.99]"
                  >
                    <span>Finish</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-5 text-[12px] text-vanta-gray-light mt-8">
          <a href="#" className="hover:text-vanta-gray transition-colors">Privacy</a>
          <a href="#" className="hover:text-vanta-gray transition-colors">Terms</a>
        </div>
      </div>
    </div>
  );
}

/** Six-box OTP entry. Backed by a single string, same shape the rest of the form already expects. */
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

  const setDigit = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join('').slice(0, OTP_LENGTH));
  };

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, '').slice(-1);
    setDigit(index, char);
    if (char && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          autoFocus={i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-13 h-15 text-center text-[20px] font-mono text-vanta-black bg-white border border-vanta-border rounded-xl focus:outline-none focus:border-vanta-navy/50 focus:ring-2 focus:ring-vanta-navy/15 transition-colors duration-150"
        />
      ))}
    </div>
  );
}
