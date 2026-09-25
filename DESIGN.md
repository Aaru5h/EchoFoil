# EchoFoil design system

Recorded from the built storefront (2026-09-26, second pass). Tokens live in `app/globals.css`.

## World

A foil producer's catalogue, modelled on the client's references (unopack.de, symetal.gr,
disposablefoilbox.com, politan.pl). The page is led by real photography and products are read by
their specs. The first pass used illustrated product art, a single green hue, pills, numbered
circles and decorative textures, and the owner called it AI slop. Those devices are retired; do not
bring them back.

## Color: restrained, with the photography carrying the color

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--bg` | `#f3f4f4` | `#111315` | page ground (cool, never cream) |
| `--surface` | `#ffffff` | `#191c1f` | tables, header, inputs |
| `--ink` | `#16181a` | `#ebeef0` | text, strong 1px rules |
| `--line` | `#d9dcde` | `#2e3337` | hairlines |
| `--graphite` | `#1c2023` | `#0b0d0e` | utility bar, business band, footer |
| `--accent` | `#2f6e51` | `#7cc4a0` | the only accent: primary button, links, active states |

Photography supplies every other color. Never add a second accent or tint a whole region green.

## Type

Sora 600 for headings (−0.03em tracking, balanced), Inter for everything else. Headings are
plain descriptions with no trailing full stop and no taglines. All specs, prices and tables use
tabular numerals, with units written after the value (`30 cm`, `12 µm`).

## Shape and surface

2px radius everywhere. No card shadows, no pills, no gradients except the hero scrim, and no
decorative textures. Structure comes from rules: a 1px ink rule starts a group, and hairlines
separate rows.

## Components

- **Hero**: full-bleed photo (`photos.heroFoil`) under a bottom-up graphite scrim, with the white
  headline bottom-left and a green primary plus a white-outline secondary button.
- **Facts row**: three plain statements separated by hairlines. No icons.
- **Range tile**: 4:5 photo, name with an arrow, and a spec list (width, thickness, product count)
  computed from the catalog.
- **Spec table** (`ProductTable`): thumbnail and name with SKU, then width, length, thickness,
  price and an outlined Add button. Below 800px each row stacks into a labelled grid.
- **Product card** (shop grid): square photo, SKU tag, 3-cell spec strip, price, and an outlined
  quick-add.
- **Thickness finder**: a segmented control and a square-root µm axis with one bar per thickness.
  The chosen category is ink, the recommended product green.
- **Business band**: photo half and graphite half, with a plain tier table from `defaultPriceTiers`.
- **Process**: six columns, each opened by an ink rule and a plain step number (it is a real
  sequence).
- **Guides**: 3:2 photos with title and summary. **FAQ**: heading column plus a list of details.

## Motion

One load moment: the hero copy rises in three staggered steps. Everything else responds to input:
a slow photo zoom on hover and the finder bars easing to their new height. All motion is off under
`prefers-reduced-motion`.

## Layout

Container 1280px with 80px gutters (48px ≤1100px, 32px ≤600px). Sections are 88px apart (64px on
tablet, 56px on mobile). Breakpoints are 1100, 800 and 600px, and the layout is verified at 390 and
1440px.

## Imagery

`public/images/photos` holds Unsplash-licensed stand-ins. Each JPEG embeds its origin, which you can
check with `embed-prompt.mjs --read`. They are illustrative, not EchoFoil products. Swap them for the
owner's product photography by editing `lib/images.ts`; nothing else hardcodes a path.
