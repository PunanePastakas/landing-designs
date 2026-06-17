# Punane Pastakas — landing page

The public landing page for **RedPen / Punane Pastakas**, a math-grading
assistant for Estonian teachers. This is Ekke's "Marked Paper" design, served
from the repo root as a single static page (intended for hosting on Vercel).

> Earlier this repo held five candidate designs (`v1`–`v5`) plus a gallery.
> Those were a review-phase experiment and have been removed — only the chosen
> design remains. The originals are still in git history and on the `main` /
> `ekke-version` branches if ever needed.

## Structure

- `index.html` — the landing page (no build step)
- `shared/` — `redpen-base.css` (design tokens), `redpen-motion.js` (animation +
  ET/EN toggle), `redpen-config.js` (public Supabase config), `redpen-waitlist.js`
  (waitlist form handler)
- `assets/redpen/` — images used on the page
- `supabase/` — the waitlist database setup (`waitlist.sql`) and notes — see
  [`supabase/README.md`](supabase/README.md)

## Run locally

Plain static files — serve the folder with anything:

```bash
python3 -m http.server 4173      # then open http://localhost:4173/
# or:  npx -y http-server -p 4173 -c-1 .
```

Tailwind and fonts currently load from a CDN, so you need an internet connection.

## Waitlist backend

The "Liitu ootenimekirjaga" form saves signups into a **Supabase** table via an
anonymous insert. To make it live you only fill in two **public** values in
`shared/redpen-config.js`. Full steps (and the important security notes about
which keys are safe to expose) are in [`supabase/README.md`](supabase/README.md).

## Deploy (Vercel)

The repo root is the site root, so Vercel needs no build command and no output
directory — point it at this repo and deploy as a static project. Set the
Supabase project's region to the EU and keep the form's privacy/consent copy in
place (GDPR).
