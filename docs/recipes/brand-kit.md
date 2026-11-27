# Handing the brand to someone outside the repo

A trademark filing, a printer, a journalist or an app store asks for the logo
as files. `npm run brand:kit` builds them from the repo, so they agree with
the site and with each other.

## Run it

```bash
npm run brand:kit            # brand-kit/<name>-brand-kit/ and a .zip
npm run brand:kit -- --pdf   # also brand-sheet.pdf (needs Playwright's Chromium)
```

Output (git-ignored, re-runnable):

| Folder             | What                                                          |
| ------------------ | ------------------------------------------------------------- |
| `svg/`             | Vectors, lettering converted to outlines                      |
| `png/`             | Transparent background, two sizes                             |
| `jpg/`             | 1800 × 1800 px, white background, 300 ppi (filings, print)    |
| `brand-sheet.html` | Variants, colours, type, differences by design. Opens offline |

## Configure it: `brand-kit.config.json`

| Key                | Meaning                                                                                |
| ------------------ | -------------------------------------------------------------------------------------- |
| `wordmark`         | `text`, `font` (a `.woff2` under `node_modules/`), `weight`, `tracking` (em)           |
| `symbol`           | The mark as a flat SVG: literal `fill`/`stroke`, no gradients, no `<style>`            |
| `negative`         | Colour swaps for dark backgrounds, `{ "from": "to" }`                                  |
| `oneInk.drop`      | Colours that become cut-outs in one ink (a highlight, a white detail)                  |
| `symbolOneInk`     | Optional hand-tuned one-ink symbol, for marks whose shapes touch                       |
| `oneInk.allowance` | How far `symbolOneInk` may differ from the colour geometry (share of area, default 5%) |
| `palette`, `type`  | Printed on the sheet                                                                   |
| `notes`            | Differences that are on purpose, printed on the sheet                                  |

## Three mistakes the kit prevents

They all happened while assembling a kit by hand for a project instanced from
this scaffold.

1. **Variants that drift.** The one-ink door was separated from its frame by
   cutting a gap around the whole leaf, which also ate into the frame: the
   hinge no longer met the opening. Derive every variant from one file, and
   take a gap from one shape only. The build measures a hand-tuned symbol
   against the derived one and refuses it past the allowance.
2. **Hairlines.** Two sub-paths that share an edge leave a thin line when
   rasterised. Draw each shape as one contour.
3. **Differences nobody can explain.** A favicon without the small details
   looks like a mistake next to the logo. If it is on purpose, say so in
   `notes`.

## What to send for a trademark search

Send what the agent asked for, and facts only. The search is worth more when
you have not steered it.

- The logo (the colour JPG) and the name. One version: what you file is what
  is protected.
- What the product does, in plain language. Let the agent choose the classes;
  each class is a separate fee, so a list of classes you guessed invites more
  of them.
- Activities you are **not** in, when the name suggests them (a regulated
  activity, for example). That changes the classification.
- Plans that are likely, stated as plans. Do not describe the product as
  narrower than it may become: a phase-one limit is an operating decision,
  not a limit on the mark.
- Leave out your own commentary on similar marks and your reasons for design
  choices. Ask about them after the results arrive.

This is a working checklist, not legal advice.
