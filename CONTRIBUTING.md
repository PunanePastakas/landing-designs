# Contributing — experimenting with the landing designs

These are five candidate landing pages for RedPen / Punane Pastakas. This guide
is for teammates who want to tweak and experiment with the designs.

`main` is the canonical version that everyone reviews at
<https://kriskur.github.io/landing-designs/>. It is **protected** — you cannot
push to it directly. All changes go through a branch and a pull request, which
keeps that shared link stable while you experiment freely.

## One-time setup

```bash
git clone https://github.com/kriskur/landing-designs.git
cd landing-designs
```

## The workflow

1. **Make a branch** — name it after yourself and what you're trying:

   ```bash
   git checkout main && git pull
   git checkout -b experiment/<your-name>-<short-idea>   # e.g. experiment/mari-bigger-hero
   ```

2. **Edit the design(s).** Each candidate is one folder:

   | Folder | Nickname     | File to edit      |
   | ------ | ------------ | ----------------- |
   | `v1/`  | Marked Paper | `v1/index.html`   |
   | `v2/`  | Cinematic    | `v2/index.html`   |
   | `v3/`  | Tres Mares   | `v3/index.html`   |
   | `v4/`  | Kontrolltöö  | `v4/index.html`   |
   | `v5/`  | Codex        | `v5/index.html`   |

   Shared styles and scripts live in `shared/` and images in `assets/` — changing
   those affects **every** design, so prefer editing inside a single `vN/` folder
   unless you mean to change all of them.

3. **Preview your change locally.** These are plain static files. From the repo
   root, start any static server and open the page:

   ```bash
   npx -y http-server -p 4173 -c-1 .
   # then open http://localhost:4173/v1/ (or v2, v3, …) in your browser
   ```

   (You can also just double-click a `vN/index.html` to open it directly; fonts
   and Tailwind load from a CDN, so you need an internet connection.)

4. **Commit and push your branch:**

   ```bash
   git add -A
   git commit -m "v1: experiment with larger hero headline"
   git push -u origin experiment/<your-name>-<short-idea>
   ```

5. **Open a pull request** on GitHub. Describe what you changed and why. Once we
   have hosted previews wired up (see below), the PR will get its own live URL so
   everyone can click through your version before it's merged.

## Merging

When a PR looks good, merge it into `main`. The public site at
<https://kriskur.github.io/landing-designs/> updates automatically within a
minute or two. Delete your branch after merging to keep things tidy.

## Notes

- **These pages are frontend-only.** The "Liitu ootenimekirjaga" (join waitlist)
  forms don't submit anywhere yet — that's intentional for the review phase.
- **Don't commit secrets** (API keys, tokens). There's nothing sensitive here and
  it should stay that way.
