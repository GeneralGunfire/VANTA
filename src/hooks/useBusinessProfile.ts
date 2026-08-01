import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';

export type RegistrationStatus = 'informal' | 'registered_vat' | 'not_yet_registered';

export interface BusinessProfile {
  id: string;
  anon_id: string;
  business_name: string | null;
  business_type: string | null;
  registration_status: RegistrationStatus;
  created_at: string;
  updated_at: string;
}

interface UseBusinessProfileResult {
  profile: BusinessProfile | null;
  isLoading: boolean;
  loadError: string | null;
  /** Upserts the profile row (create on first save, update thereafter). */
  saveProfile: (fields: Partial<Pick<BusinessProfile, 'business_name' | 'business_type' | 'registration_status'>>) => Promise<void>;
}

/**
 * Same shape as the other data hooks (useDebts, useInventory, etc.), scoped
 * by anon_id since this app has no real Supabase auth. business_profile is
 * unique on anon_id (see 0003_phase2_features.sql), so a save is always an
 * upsert keyed on that column.
 */
export function useBusinessProfile(): UseBusinessProfileResult {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        if (!supabase) throw new Error('Supabase is not configured — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');

        const { data, error } = await supabase
          .from('business_profile')
          .select('*')
          .eq('anon_id', getAnonId())
          .maybeSingle();

        if (error) throw error;
        setProfile(data as BusinessProfile | null);
      } catch (err: any) {
        console.error('Error fetching business profile:', err);
        setLoadError(err?.message ?? String(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const saveProfile: UseBusinessProfileResult['saveProfile'] = async (fields) => {
    if (!supabase) throw new Error('Supabase is not configured — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');

    const anon_id = getAnonId();
    const { data, error } = await supabase
      .from('business_profile')
      .upsert({ anon_id, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'anon_id' })
      .select('*')
      .single();

    if (error) throw error;
    setProfile(data as BusinessProfile);
  };

  return { profile, isLoading, loadError, saveProfile };
}
