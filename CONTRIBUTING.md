# Contributing

The landing page for RedPen / Punane Pastakas. One static page at `index.html`,
no build step. `main` is protected — work on a branch and open a pull request.

## Setup & preview

```bash
git clone https://github.com/PunanePastakas/landing-designs.git
cd landing-designs
python3 -m http.server 4173      # then open http://localhost:4173/
```

Fonts and Tailwind load from a CDN, so you need an internet connection.

## What lives where

| Path | What it is |
| ---- | ---------- |
| `index.html` | the page |
| `shared/redpen-base.css` | design tokens / base styles |
| `shared/redpen-motion.js` | animations + ET/EN language toggle |
| `shared/redpen-config.js` | **public** Supabase URL + anon key |
| `shared/redpen-waitlist.js` | waitlist form → Supabase insert |
| `assets/redpen/` | images |
| `supabase/` | waitlist DB schema + setup notes |

## Workflow

```bash
git checkout main && git pull
git checkout -b <your-name>-<short-idea>
# edit, then:
python3 -m http.server 4173      # preview at http://localhost:4173/
git add -A && git commit -m "describe the change"
git push -u origin <your-name>-<short-idea>
# open a PR
```

## Notes

- **The waitlist form is live** — it writes to Supabase. See
  [`supabase/README.md`](supabase/README.md) for how it works and how to read
  signups.
- **Don't commit secrets.** The Supabase *anon* key in `redpen-config.js` is
  public by design and is fine to commit. The **service_role** key, the database
  password, and any personal access token are secret — they must never appear in
  this repo or in the browser.
