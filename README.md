# Navkar Navratri Utsav 2026 (Season 9) — Landing Page

Static, festive landing page for Navkar Navratri Utsav Season 9 — 11–19 October 2026,
Jalvihar, Necklace Road, Hyderabad.

No build step and no dependencies. Open `html/index.html` in a browser, or serve the
project root with any static server.

## Structure

```
navkar lp/
├─ html/
│  └─ index.html          Markup only
├─ css/
│  ├─ base.css            Design tokens (:root), reset, fluid type, buttons, reveal primitives
│  ├─ decor.css           Navratri motifs: mandalas, dandiya marks, particles, glows, marquee
│  ├─ nav.css             Fixed nav, mobile drawer, sticky booking bar
│  ├─ hero.css            Cinematic hero
│  ├─ sections.css        Intro, experience, legacy, workshop, passes, venue, partners, FAQ, final, footer
│  ├─ gallery.css         Drag/snap photo strip + lightbox
│  └─ modal.css           Registration modal
├─ js/
│  └─ main.js             All interaction (see below)
└─ assets/
   ├─ img/                Web-ready variants the page actually loads
   ├─ images/             Original poster + video
   └─ *.jpeg              Original camera-resolution photos (untouched)
```

Stylesheets load in cascade order: `base → decor → nav → hero → sections → gallery → modal`.
Keep that order — everything downstream relies on the tokens defined in `base.css`.

## Design system

- **Palette** is sampled from the Season 9 key art (the "1 Month To Go" poster) and lives
  entirely in `:root` in `css/base.css`. Add new colours there rather than hard-coding hex.

  | Token | Value | Role |
  |---|---|---|
  | `--yellow` | `#FCE60A` | the key art's dominant yellow |
  | `--cream` / `--cream-2` | `#FFF9DC` / `#FFEF9E` | page base / alternating sections |
  | `--magenta` | `#E30B54` | key-art pink — the primary accent |
  | `--teal` | `#C4012F` | crimson (the token name is legacy) |
  | `--purple` | `#9C0043` | deep rose (likewise) |
  | `--marigold` | `#FBC51B` | gold |
  | `--orange` | `#EE5A18` | warm red-orange |
  | `--ink` | `#3B0A1F` | deep wine — headings and dark sections |

  An area census of the key art reads: **yellows ~50%, pinks ~8.4%, dark reds ~4.4%** —
  pink outweighs the dark reds about 2:1, and those dark reds are only the drop-shadows
  behind the lettering, not surfaces. So the dark tones here lean **wine** (toward the
  pink) rather than brown-maroon, and pink carries the accent work: the ticker band under
  the hero, the heading underline, buttons and card fills.

  The key art has no purple and no teal, so those two tokens now carry crimson and deep
  rose. The names were kept deliberately so every downstream rule still resolves.

  `--magenta-ink` and `--orange-ink` are darker variants for **small text on light
  backgrounds** — the display versions only reach 4.47:1 and 2.96:1 on `--cream`, under the
  4.5 minimum. Use the `-ink` token whenever the colour is type rather than a fill.
- **Type**: Outfit (display) + Inter (body), sized with `clamp()` so it scales fluidly
  instead of stepping at breakpoints.
- **Buttons** are pills carrying a hard, un-blurred offset shadow. `.btn` plus a modifier
  (`.btn-yellow`, `.btn-ink`, `.btn-teal`, `.btn-glass` for use over photography).
- **Image treatments** are composable classes: `.img-frame` (rounded, hover zoom, gradient
  veil), `.img-arch` (mandap silhouette), `.img-circle`, `.img-keyline` (inset gold hairline),
  `.img-cap` (floating caption chip).
- **Decor** is all `aria-hidden` and driven by `<use>` references to the SVG symbol sheet at
  the top of `index.html`. Style symbols with presentation **attributes**, not CSS classes —
  a `<use>` clones into a shadow tree that outside class selectors cannot reach.

## Interaction (`js/main.js`)

Dependency-free, organised as numbered IIFEs: hero entrance, nav stuck/auto-hide/scrollspy,
mobile drawer, sticky CTA bar, scroll reveal + counters, parallax, particles, FAQ accordion,
gallery drag + lightbox, registration modal, anchor scrolling.

- Any element with `data-cta` opens the registration modal. Optional `data-pass`,
  `data-amt` (a plain number) and `data-night` preselect and lock the relevant fields.
- The modal computes its own total (`unit × quantity`); a pass carrying a fixed
  `data-night` disables the night picker.
- `data-reveal` marks an element for scroll reveal; `data-stagger="90"` on a parent
  cascades its children. `data-parallax="0.12"` sets parallax strength.
- `data-count="40"` animates a number up from zero when it scrolls into view.
- Visiting the page with `#open` in the URL opens the modal on load.
- Everything is disabled under `prefers-reduced-motion: reduce`.

## Images

`assets/img/` holds generated variants at 1800w / 1100w / 650w, referenced via `srcset`
so phones download roughly a quarter of the desktop payload. The originals in `assets/`
are the source of truth and are never loaded by the page.

These variants are cropped 10% off the top to remove the photographer's watermark —
the credit is carried on-page instead (hero footer and the partners list). To regenerate
with the watermark intact, set `$cropTop = 0` in the resize script and re-run it.

`assets/logo.png` is the supplied master logo (960×960, no alpha, white corners).
`assets/img/logo-128.png` and `logo-320.png` are circular-masked PNGs generated from it,
used in the nav, the footer and as the favicon.

## Background video

The "Navkar is back. Nine seasons." band can run a video behind it. Drop the encoded
files into `assets/video/` as `legacy.mp4` (required) and `legacy.webm` (optional);
`assets/video/README.txt` carries the target specs and the ffmpeg commands.

The photograph underneath is the permanent fallback — the video only fades in once it is
genuinely playing. It is deliberately skipped, leaving the still in place, when:

- no file is present, or the file fails to load
- the browser refuses muted autoplay
- `prefers-reduced-motion: reduce` is set
- the connection reports `saveData` or `2g`
- the viewport is 768px or narrower (phones pay most, gain least)

Sources are attached lazily via `IntersectionObserver`, so nothing is fetched until the
band is near the viewport, and playback pauses whenever it scrolls out of view.

To move it to another section, add `data-bg-video` to a `<video>` inside that section's
media layer — the loader picks up every element carrying that attribute.

## Local preview

```bash
# from the project root
python -m http.server 8000     # then visit http://localhost:8000/html/
```

## Outstanding

Red `Confirm` tags mark facts awaiting client sign-off (gate times, parking, workshop
venue, the Group of 6 / ₹999 VIP tiers). Remove them before launch. The venue map is a
styled placeholder awaiting a real embed, and 36 of 40 partner logos are still outstanding.
