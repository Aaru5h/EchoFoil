# EchoFoil design system

Updated 2026-10-23 for the restrained catalogue refinement. Tokens live in `app/globals.css`.

## World

A foil producer's catalogue, modelled on the client's references (unopack.de, symetal.gr,
disposablefoilbox.com, politan.pl). The page is led by real photography and products are read by
their specs. The first pass used illustrated product art, a single green hue, pills, numbered
circles and decorative textures, and the owner called it AI slop. Those devices are retired; do not
bring them back.

## Color: restrained, with the photography carrying the color

| Token        | Light     | Dark      | Role                                                  |
| ------------ | --------- | --------- | ----------------------------------------------------- |
| `--bg`       | `#f3f4f4` | `#111315` | page ground (cool, never cream)                       |
| `--surface`  | `#ffffff` | `#191c1f` | tables, header, inputs                                |
| `--ink`      | `#16181a` | `#ebeef0` | text, strong 1px rules                                |
| `--line`     | `#d9dcde` | `#2e3337` | hairlines                                             |
| `--graphite` | `#1c2023` | `#0b0d0e` | utility bar, business band, footer                    |
| `--accent`   | `#2f6e51` | `#7cc4a0` | the only accent: primary button, links, active states |

Photography supplies every other color. Never add a second accent or tint a whole region green.

## Type

Sora 600 for headings (−0.03em tracking, balanced), Inter for everything else. Headings are
plain descriptions with no trailing full stop and no taglines. All specs, prices and tables use
tabular numerals, with units written after the value (`30 cm`, `12 µm`).

## Shape and surface

2px radius everywhere. No card shadows, no pills, no decorative gradients, and no
decorative textures. Structure comes from rules: a 1px ink rule starts a group, and hairlines
separate rows.

## Components

- **Hero**: compact two-column introduction, readable theme-aware text beside a contained foil photo (`photos.heroFoil`). Green shopping action, outlined quote action, and direct category links. On small screens the image follows the content. No text overlays or entrance animation.
- **Facts row**: three plain statements separated by hairlines. No icons.
- **Range tile**: 4:3 photo, name with an arrow, and a spec list (width, thickness, product count)
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

Content is visible immediately. Motion responds only to input: photo hover and finder changes.
All motion is off under `prefers-reduced-motion`. No scroll-progress decoration or per-scroll progress state.

## Layout

Container 1280px with 80px gutters (48px ≤1100px, 32px ≤600px). Sections are 88px apart (64px on
tablet, 56px on mobile). Breakpoints are 1100, 800 and 600px, and the layout is verified at 390 and
1440px.

## Imagery

`public/images/photos` holds Unsplash-licensed stand-ins. Each JPEG embeds its origin, which you can
check with `embed-prompt.mjs --read`. They are illustrative, not EchoFoil products. Swap them for the
owner's product photography by editing `lib/images.ts`; nothing else hardcodes a path.

## Requirements and scope · 2026-10-23

The brief is a credible foil website that looks considered without excessive visuals or performance cost.
Preserve EchoFoil's identity, existing factual copy, Albanian/English routes, themes, catalogue,
cart, checkout, account and quote functionality. Improve the storefront's hierarchy rather than
rebuild the application. Product specifications and next actions should be easier to find than decoration.

### Reference interpretation

Reviewed the supplied pages on 2026-10-23. These are information-design references, not assets to copy:

| Reference                                                              | Useful principle                                     | EchoFoil application                                                            |
| ---------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| [UnoPack](https://www.unopack.de/en/products/aluminium-household-foil) | Explicit widths, thicknesses and packing information | Keep catalogue specification tables prominent; retain mobile specs              |
| [Symetal](https://www.symetal.gr/en/home-page)                         | Organize aluminium products around applications      | Preserve clear household, catering and packaging category navigation            |
| [FirstAlu](https://www.disposablefoilbox.com/)                         | Separate product discovery and wholesale quotation   | Maintain distinct shop and quote calls to action                                |
| [Politan](https://politan.pl/marka-wlasna/pozostale-produkty/)         | Product categories followed by business contact      | Keep business enquiries accessible without inventing private-label capabilities |

Do not import competitor certifications, manufacturing claims, client counts or sustainability promises.
The references' content was inspected; this is not a pixel-matched reproduction.

### Decisions and tradeoffs

- A contained foil image keeps material character while making the heading readable without a scrim.
- The intro uses a moderate 32–48px heading instead of a viewport-sized campaign treatment.
- Direct category links offer a fast route without scrolling through photography.
- Landscape category photos reduce page height while preserving recognisable imagery.
- Product counts and thickness remain visible on mobile; density must not remove buying information.
- Preserve the existing sections and copy. The scope does not rewrite business claims or alter pricing.
- Remove the decorative progress bar, eliminating React state updates for every scroll position.

### Performance and accessibility contract

No new dependency, animation library, remote font, video, carousel or background effect. Home content
continues to render on the server. Use Next Image, explicit image slots and responsive sizes; only
the introductory image is priority-loaded. Category sizes match the actual 1100px grid breakpoint.
Local Sora and Inter remain. Preserve native links, visible focus, semantic headings and reduced motion.
Target no horizontal overflow from 360px through 1440px. Verify both languages and both themes.
Production goals: LCP ≤2.5s, CLS ≤0.1, INP ≤200ms at the 75th percentile. These are acceptance targets,
not measured results from a development server; field performance still requires deployment measurements.

### Content limitations

Existing photographs are illustrative stand-ins, not verified EchoFoil product photography. Sample
catalogue prices/specifications and business details require owner verification before production.
Do not use this UI refinement as evidence that those claims have been verified.

### Implementation and verification

Implementation: `app/[locale]/page.tsx`, `app/globals.css`, `components/layout/shell.tsx`.
Verification results are recorded in `docs/UI-REVIEW-2026-10-23.md` after the implementation checks.
