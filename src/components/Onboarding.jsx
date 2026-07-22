import { useState } from "react";
import { supabase } from "../supabaseClient";

const STEPS = {
  PHONE: "phone",
  OTP: "otp",
  BUSINESS_NAME: "business_name",
  BUSINESS_TYPE: "business_type",
};

export default function Onboarding({ startStep = STEPS.PHONE, skipProfile = false, onComplete }) {
  const [step, setStep] = useState(startStep);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handlePhoneSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmed = phone.trim();
    if (!trimmed) return;
    setBusy(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: trimmed });
    setBusy(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep(STEPS.OTP);
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmed = otp.trim();
    if (!trimmed) return;
    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: trimmed,
      type: "sms",
    });
    setBusy(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    if (skipProfile) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        onComplete();
        return;
      }
    }

    setStep(STEPS.BUSINESS_NAME);
  }

  function handleBusinessNameSubmit(e) {
    e.preventDefault();
    if (!businessName.trim()) return;
    setStep(STEPS.BUSINESS_TYPE);
  }

  async function handleBusinessTypeSubmit(e) {
    e.preventDefault();
    setError("");
    if (!businessType.trim()) return;

    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      business_name: businessName.trim(),
      business_type: businessType.trim(),
    });
    setBusy(false);

    if (profileError) {
      setError(profileError.message);
      return;
    }
    onComplete();
  }

  return (
    <div className="chat-view chat-view-empty">
      <div className="hero-state onboarding-state">
        {step === STEPS.PHONE && (
          <>
            <h1 className="hero-headline">What's your phone number?</h1>
            <form className="onboarding-form" onSubmit={handlePhoneSubmit}>
              <input
                type="tel"
                inputMode="tel"
                placeholder="+27 82 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
                disabled={busy}
              />
              <button type="submit" className="btn btn-primary" disabled={busy || !phone.trim()}>
                {busy ? "Sending…" : "Send code"}
              </button>
            </form>
          </>
        )}

        {step === STEPS.OTP && (
          <>
            <h1 className="hero-headline">Enter the code we sent you</h1>
            <form className="onboarding-form" onSubmit={handleOtpSubmit}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
                disabled={busy}
              />
              <button type="submit" className="btn btn-primary" disabled={busy || !otp.trim()}>
                {busy ? "Verifying…" : "Verify"}
              </button>
            </form>
          </>
        )}

        {step === STEPS.BUSINESS_NAME && (
          <>
            <h1 className="hero-headline">What's your business called?</h1>
            <form className="onboarding-form" onSubmit={handleBusinessNameSubmit}>
              <input
                type="text"
                placeholder="e.g. Thandi's Spaza Shop"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" disabled={!businessName.trim()}>
                Next
              </button>
            </form>
          </>
        )}

        {step === STEPS.BUSINESS_TYPE && (
          <>
            <h1 className="hero-headline">What kind of business is it?</h1>
            <form className="onboarding-form" onSubmit={handleBusinessTypeSubmit}>
              <input
                type="text"
                placeholder="e.g. Spaza shop, salon, taxi"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                autoFocus
                disabled={busy}
              />
              <button type="submit" className="btn btn-primary" disabled={busy || !businessType.trim()}>
                {busy ? "Saving…" : "Done"}
              </button>
            </form>
          </>
        )}

        {error && <p className="onboarding-error">{error}</p>}
      </div>
    </div>
  );
}

export { STEPS as ONBOARDING_STEPS };
