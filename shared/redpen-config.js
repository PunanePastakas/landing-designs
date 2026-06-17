/* ── PunanePastakas public runtime config ───────────────────────────────
   These two values are PUBLIC by design. The Supabase anon key is meant to
   ship in client-side code; it is safe ONLY because the `waitlist` table has
   Row Level Security enabled with an INSERT-only policy for the `anon` role
   (see supabase/waitlist.sql). Never put the service_role key here.

   To go live: replace the two placeholders below with the values from your
   Supabase project → Settings → API (Project URL + anon/public key). */
window.REDPEN_CONFIG = {
  SUPABASE_URL: 'https://ykclvwqqdzcwcxfitutz.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrY2x2d3FxZHpjd2N4Zml0dXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODI2MjYsImV4cCI6MjA5NzI1ODYyNn0.T9Dp_WoD5iSX-Xw4AEbzUmY52MHRZwxNxajkSVpFcNY',
};
