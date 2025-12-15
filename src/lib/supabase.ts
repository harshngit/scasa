import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tzaemqzrdmwbcgriyymg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YWVtcXpyZG13YmNncml5eW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NjIwMzIsImV4cCI6MjA4MDIzODAzMn0.Sw82hrzJ6r_rmzW3WZc5AH5bpaiWcd76Cs-WbRhamNU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

