/* ── PunanePastakas public runtime config ───────────────────────────────
   These two values are PUBLIC by design. The Supabase anon key is meant to
   ship in client-side code; it is safe ONLY because the `waitlist` table has
   Row Level Security enabled with an INSERT-only policy for the `anon` role
   (see supabase/waitlist.sql). Never put the service_role key here.

   To go live: replace the two placeholders below with the values from your
   Supabase project → Settings → API (Project URL + anon/public key). */
window.REDPEN_CONFIG = {
  SUPABASE_URL: '__SUPABASE_URL__',        // e.g. https://abcdefgh.supabase.co
  SUPABASE_ANON_KEY: '__SUPABASE_ANON_KEY__', // the long "anon public" JWT
};
