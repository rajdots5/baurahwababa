import { createClient } from '@supabase/supabase-js';

// Server-only admin client — uses service role key (bypasses RLS)
// NEVER import this file in client components or any file prefixed with "use client"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase admin env variables. Add SUPABASE_SERVICE_ROLE_KEY to .env.local');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
