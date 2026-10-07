import { createClient } from '@supabase/supabase-js';
import type { EvidenceItem } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type AnalysisRecord = {
  id: string;
  user_id: string;
  url: string;
  verdict: 'SAFE' | 'REVIEW' | 'SUSPICIOUS';
  hostname: string | null;
  evidence: EvidenceItem[];
  created_at: string;
};
