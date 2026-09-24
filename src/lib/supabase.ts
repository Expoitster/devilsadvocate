/**
 * The Supabase client for the waitlist. It uses the project's public
 * anon/publishable key, so everything it can do is limited by row-level
 * security: insert into public.waitlist, and nothing else. Never put a
 * service-role or secret key here, or anywhere in the site.
 *
 * waitlist.ts imports this lazily, so the library only loads for people
 * who start filling in the form.
 */
import { createClient } from '@supabase/supabase-js';
import { WAITLIST } from '../config';

export const supabase = createClient(WAITLIST.supabaseUrl, WAITLIST.supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
