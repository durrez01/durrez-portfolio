# Durrez Ahmed — portfolio

A cinematic, scroll-driven portfolio: a Three.js card gallery, a GSAP/ScrollTrigger
score, and Lenis smooth scrolling. Structure and motion follow the
`noa-vale.aura.build` template; all copy, data and artwork are mine.

## Run it

Any static server works — the page needs HTTP, not `file://`, because the studio
panel fetches `assets/img/portrait/contour.svg`.

```sh
python3 -m http.server 8777
open http://localhost:8777/
```

## Contact form

The "Let's discuss" dialog is a generic contact form (name, email, message — for
recruiters, collaborators, anyone). It POSTs to `api/contact.js`, a Vercel
serverless function that relays the message over Gmail SMTP to
`durrezahmed01@gmail.com`. If the endpoint is unreachable (e.g. plain static
hosting), the form falls back to opening the visitor's email app via `mailto:`.

Setup (once):

1. Google Account → Security → 2-Step Verification → App passwords → create one.
2. Set env vars on Vercel (`vercel env add` or dashboard): `SMTP_USER` (the Gmail
   address) and `SMTP_PASS` (the app password). Optional: `CONTACT_TO`,
   `SMTP_HOST`, `SMTP_PORT` (defaults: durrezahmed01@gmail.com, smtp.gmail.com, 465).
3. Local test: copy `.env.example` to `.env`, fill it, run `npx vercel dev`.

Never commit `.env` — `.gitignore` already excludes it.

## Layout

```
index.html              markup, asset resolver, inline contact button (iframe)
assets/css/             fonts.css (embedded Geist / IBM Plex Mono / Bricolage) + panel styles
assets/vendor/          three.min.js, gsap.min.js, ScrollTrigger.min.js, lenis.min.js
assets/js/              the app, one file per concern
assets/img/             generated artwork (work, practice, portrait, identity, guide)
tools/generate_art.py   redraws every image in assets/img
tools/fonts/            TTFs used by the generator only
```

## Editing content

| What | Where |
| --- | --- |
| Name, role, biography cards | `assets/js/projects.js` |
| The eight main systems | `window.PORTFOLIO` in `assets/js/projects.js` |
| Detail-panel and card-back notes (16) | `assets/js/study-notes.js` |
| The eight secondary studies | `extraStudies` in `assets/js/main.js` |
| Streams / Systems / Scale copy | `disciplines` in `assets/js/main.js`, plus the `#practice` markup |
| Section headings, nav, footer | `index.html` |
| Scroll pacing | `assets/js/score.js` |

`window.PORTFOLIO[i]` is merged with `window.STUDY_NOTES[i]` at load, so both
arrays must stay the same length and order (8 main + 8 secondary = 16 studies).

## Artwork

Every image is drawn by `tools/generate_art.py` (Pillow) — no third-party imagery
ships with the site. Change a motif or an accent there and re-run:

```sh
python3 tools/generate_art.py
```

Sizes: work plates 940×1672, practice plates 1122×1402, portrait 1024×1536.
`assets/img/portrait/contour.svg` is generated from the same geometry as the
portrait, so the studio panel draws the outline of the artwork it reveals.

## Deploying

The folder is a plain static site with no build step and no external requests —
fonts are embedded in `assets/css/fonts.css` and every library is vendored. Drop
`durrez-portfolio/` on any static host (Netlify, Vercel, GitHub Pages, S3) and it
runs as-is.

## Notes

- Motion files (`.mp4`) are not part of this build; `motionSources` in `main.js`
  is empty and every study shows its still plate.
- `prefers-reduced-motion` drops the WebGL gallery and renders a static page.
- The resume's education, phone and profile links are not on the site yet; add
  them to the footer in `index.html` when you want them.
