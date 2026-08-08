import { useEffect, useState } from 'react';
import { AlertTriangle, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBusinessProfile, type RegistrationStatus } from '../hooks/useBusinessProfile';
import { cn } from '../lib/utils';
import { SHADOW_SM } from '../lib/surfaces';

const BUSINESS_TYPES: { value: string; label: string }[] = [
  { value: 'sole_proprietor', label: 'Informal / not yet registered' },
  { value: 'sole_prop_registered', label: 'Sole proprietor (registered)' },
  { value: 'private_company', label: 'Private company (Pty) Ltd' },
  { value: 'partnership', label: 'Partnership' },
];

const REGISTRATION_OPTIONS: { value: RegistrationStatus; label: string }[] = [
  { value: 'informal', label: 'Informal / not registered for tax' },
  { value: 'not_yet_registered', label: 'Registered business, not yet VAT registered' },
  { value: 'registered_vat', label: 'VAT registered' },
];

/**
 * The one real place to edit the business's own facts — name, type, and
 * tax registration status — all persisted to `business_profile`. Sign-up
 * (AuthPage's business step) writes the same row on first save, so this
 * page edits that data rather than keeping a disconnected second copy.
 * Tax Calendar reads registration_status from here instead of its old
 * session-only toggle.
 */
export default function BusinessProfilePage() {
  const { profile, isLoading, loadError, saveProfile } = useBusinessProfile();

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('sole_proprietor');
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('informal');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setBusinessName(profile.business_name ?? '');
    setBusinessType(profile.business_type ?? 'sole_proprietor');
    setRegistrationStatus(profile.registration_status);
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProfile({
        business_name: businessName.trim() || null,
        business_type: businessType,
        registration_status: registrationStatus,
      });
      toast.success('Business profile saved');
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not save — try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-vanta-black">Business Profile</h1>
          <p className="text-sm text-vanta-gray mt-1">Your business's own details — used across Vanta, including the Tax Calendar</p>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-vanta-gray text-sm italic">Loading…</div>
        ) : loadError ? (
          <div role="alert" className="flex items-center justify-center gap-2 py-16 text-vanta-black text-sm px-6">
            <AlertTriangle size={16} />
            Couldn't load your business profile: {loadError}
          </div>
        ) : (
          <div className="border border-vanta-border rounded-2xl bg-white p-6 space-y-6" style={{ boxShadow: SHADOW_SM }}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-vanta-navy text-white flex items-center justify-center shrink-0">
                <Building2 size={16} />
              </div>
              <p className="text-xs text-vanta-gray leading-relaxed pt-2">
                {profile
                  ? "This is the same information collected when you signed up — edit it any time."
                  : 'Nothing saved yet — fill this in so Vanta has your business details on record.'}
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-vanta-gray mb-2">Business name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Nomsa's Bakery"
                  className="w-full text-sm bg-white border border-vanta-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-vanta-navy/40 transition-colors text-vanta-black placeholder:text-vanta-gray-light"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-vanta-gray mb-2">What kind of business is it?</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full text-sm bg-white border border-vanta-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-vanta-navy/40 transition-colors text-vanta-black"
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-vanta-gray mb-2">Tax registration status</label>
                <div className="flex items-center gap-1.5 bg-vanta-sidebar p-1.5 border border-vanta-border rounded-full text-xs w-fit flex-wrap">
                  {REGISTRATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRegistrationStatus(opt.value)}
                      className={cn(
                        'px-4 py-2 font-medium transition-all rounded-full whitespace-nowrap',
                        registrationStatus === opt.value
                          ? 'bg-white text-vanta-black border border-vanta-border shadow-sm'
                          : 'text-vanta-gray hover:text-vanta-black border border-transparent',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-vanta-gray-light mt-2 leading-relaxed">
                  This controls whether VAT deadlines show on your Tax Calendar.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-vanta-border flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-vanta-navy text-white px-5 py-2.5 text-xs font-semibold transition-colors duration-150 rounded-lg active:scale-[0.98] hover:bg-vanta-navy/90 disabled:opacity-50"
                style={{ boxShadow: SHADOW_SM }}
              >
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
