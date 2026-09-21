/**
 * Generates the product placeholder artwork in public/images/placeholders.
 *
 *   node scripts/generate-placeholders.mjs
 *
 * Two rules these drawings follow, both of which matter:
 *
 * 1. No text in the artwork. Baked-in words cannot be translated, so an English
 *    label would sit untranslated on the Albanian storefront. Products are
 *    identified by silhouette and by the alt text in lib/images.ts instead.
 * 2. Every product gets its own silhouette. Six restamps of one shape read as
 *    unfinished no matter how well the shape is drawn.
 *
 * The owner replaces these with real photography; see lib/images.ts.
 */
import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync("public/images/placeholders", { recursive: true });

const SIZE = 800;
const GREEN = "#4F9A78";
const GREEN_DEEP = "#2F6E51";
const KRAFT_DEEP = "#9C7743";

/**
 * `id` namespaces the gradients so several of these SVGs can be inlined on the
 * same page without their defs colliding.
 */
const defs = (id) => `
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F8F9F8"/>
      <stop offset="100%" stop-color="#DBE2DC"/>
    </linearGradient>
    <linearGradient id="mx${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#99A2AA"/>
      <stop offset="14%" stop-color="#EDF1F4"/>
      <stop offset="33%" stop-color="#BCC4CB"/>
      <stop offset="53%" stop-color="#F8FAFC"/>
      <stop offset="75%" stop-color="#B0B9C0"/>
      <stop offset="100%" stop-color="#8C959D"/>
    </linearGradient>
    <linearGradient id="my${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F8FAFC"/>
      <stop offset="34%" stop-color="#D2D9DF"/>
      <stop offset="70%" stop-color="#ACB5BD"/>
      <stop offset="100%" stop-color="#8A939B"/>
    </linearGradient>
    <linearGradient id="kr${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#9C7743"/>
      <stop offset="20%" stop-color="#DCBC91"/>
      <stop offset="50%" stop-color="#C6A275"/>
      <stop offset="80%" stop-color="#D8B78B"/>
      <stop offset="100%" stop-color="#8F6C3C"/>
    </linearGradient>
    <linearGradient id="band${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GREEN}"/>
      <stop offset="100%" stop-color="${GREEN_DEEP}"/>
    </linearGradient>
    <radialGradient id="sh${id}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#0B0D10" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="#0B0D10" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

/** Backdrop + contact shadow. `cx`/`ry` let each composition sit differently. */
const stage = (id, { cx = 400, cy = 372, r = 296, sx = 400, sy = 650, sr = 236 } = {}) => `
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${id})"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="0.55"/>
  <ellipse cx="${sx}" cy="${sy}" rx="${sr}" ry="32" fill="url(#sh${id})"/>`;

/**
 * The "echo" motif from the EchoFoil mark: three concentric arcs opening right,
 * like a signal radiating. Language-neutral branding for the carton faces, in
 * place of a wordmark.
 *
 * Each arc runs from -60deg to +60deg at radius R, so it occupies x from
 * cx + R/2 to cx + R. `h` is the intended overall height of the mark; the radii
 * and the centre offset are derived from it so callers can position by eye.
 */
function echo(centreX, centreY, h, color, opacity = 1) {
  const base = h / 3.46; // outer arc height is 2*sin(60deg)*2*base
  const cx = centreX - base * 1.25; // shift so the arc cluster sits centred
  return [1, 1.5, 2]
    .map((k, i) => {
      const r = base * k;
      const x = (cx + r * 0.5).toFixed(1);
      const top = (centreY - r * 0.866).toFixed(1);
      const bottom = (centreY + r * 0.866).toFixed(1);
      return `<path d="M${x} ${top} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x} ${bottom}" fill="none" stroke="${color}" stroke-width="${(base * 0.3).toFixed(1)}" stroke-linecap="round" opacity="${(opacity * (1 - i * 0.2)).toFixed(2)}"/>`;
    })
    .join("");
}

/**
 * A foil carton in light 3/4 projection, with the roll's cut end showing at the
 * right and a serrated cutter strip along the front bottom edge.
 *
 * `d` is the depth of the projection; `band` scales the green label panel.
 */
function carton(id, { x, y, w, h, d = 58, cutter = true, arcs = 1 }) {
  const dx = d * 0.58;
  const dy = -d * 0.42;
  const teeth = [];
  if (cutter) {
    for (let tx = x + 10; tx < x + w - 10; tx += 22) {
      teeth.push(`M${tx} ${y + h} l11 13 l11 -13`);
    }
  }
  return `
  <g>
    <!-- exposed roll end, drawn first so the carton overlaps it -->
    <ellipse cx="${x + w + dx}" cy="${y + h * 0.42 + dy}" rx="${d * 0.42}" ry="${h * 0.3}" fill="url(#my${id})" stroke="#8B949C" stroke-width="2"/>
    <ellipse cx="${x + w + dx}" cy="${y + h * 0.42 + dy}" rx="${d * 0.14}" ry="${h * 0.1}" fill="#A9B2BA"/>

    <!-- carton body -->
    <path d="M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z" fill="url(#band${id})"/>
    <path d="M${x} ${y} L${x + dx} ${y + dy} L${x + w + dx} ${y + dy} L${x + w} ${y} Z" fill="${GREEN}" opacity="0.82"/>
    <path d="M${x + w} ${y} L${x + w + dx} ${y + dy} L${x + w + dx} ${y + h + dy} L${x + w} ${y + h} Z" fill="${GREEN_DEEP}"/>

    <!-- brushed-metal window across the label -->
    <rect x="${x}" y="${y + h * 0.52}" width="${w}" height="${h * 0.2}" fill="url(#mx${id})" opacity="0.9"/>

    ${echo(x + w * 0.5, y + h * 0.3, h * 0.2 * arcs, "#EAF3EE", 0.95)}

    ${
      cutter
        ? `<path d="${teeth.join(" ")}" fill="none" stroke="#8B949C" stroke-width="3" stroke-linejoin="round"/>`
        : ""
    }
    <path d="M${x} ${y} L${x} ${y + h}" stroke="#20402F" stroke-width="2" opacity="0.35"/>
  </g>`;
}

/** Bare wide rolls stacked on their sides — reads as pallet stock, not retail. */
function bulk(id) {
  // bandOff staggers the label bands; aligned bands read as one painted stripe
  // across the stack rather than three separate rolls.
  const log = (cx, cy, len, rad, bandOff = 0) => `
    <g>
      <rect x="${cx - len / 2}" y="${cy - rad}" width="${len}" height="${rad * 2}" fill="url(#my${id})"/>
      <ellipse cx="${cx + len / 2}" cy="${cy}" rx="${rad * 0.34}" ry="${rad}" fill="#E4E9ED" stroke="#8B949C" stroke-width="2"/>
      <ellipse cx="${cx + len / 2}" cy="${cy}" rx="${rad * 0.12}" ry="${rad * 0.34}" fill="${GREEN}" opacity="0.5"/>
      <ellipse cx="${cx - len / 2}" cy="${cy}" rx="${rad * 0.34}" ry="${rad}" fill="#B6BEC5" opacity="0.7"/>
      <rect x="${cx - len / 2}" y="${cy - rad}" width="${len}" height="${rad * 2}" fill="none" stroke="#8B949C" stroke-width="2"/>
      <rect x="${cx + bandOff - len * 0.16}" y="${cy - rad}" width="${len * 0.32}" height="${rad * 2}" fill="url(#band${id})" opacity="0.95"/>
      ${echo(cx + bandOff, cy, rad * 1.05, "#EAF3EE", 0.9)}
    </g>`;
  return `
  <g>
    ${log(372, 520, 400, 78, -54)}
    ${log(372, 366, 400, 78, 40)}
    ${log(400, 214, 400, 78, -22)}
  </g>`;
}

/**
 * Takeaway tray, seen slightly from above. A real tray is widest at the rim and
 * narrows toward the base - drawing that taper the other way round turns it into
 * a lampshade, so the wall path must run from the wide rim down to a narrow base.
 */
function tray(id) {
  const rimY = 352,
    rimRx = 156,
    rimRy = 44;
  const baseY = 536,
    baseRx = 104,
    baseRy = 28;
  return `
  <g>
    <!-- outer wall, rim (wide) down to base (narrow) -->
    <path d="M${400 - rimRx} ${rimY} L${400 - baseRx} ${baseY} A ${baseRx} ${baseRy} 0 0 0 ${400 + baseRx} ${baseY} L${400 + rimRx} ${rimY} Z"
          fill="url(#mx${id})" stroke="#8B949C" stroke-width="2" stroke-linejoin="round"/>
    <!-- corrugated flutes following the taper -->
    ${Array.from({ length: 13 }, (_, i) => {
      const t = (i + 1) / 14;
      const topX = 400 - rimRx + 2 * rimRx * t;
      const botX = 400 - baseRx + 2 * baseRx * t;
      return `<path d="M${topX.toFixed(1)} ${rimY} L${botX.toFixed(1)} ${(baseY - 4).toFixed(1)}" stroke="#9EA7AE" stroke-width="2.5" opacity="0.5"/>`;
    }).join("")}
    <!-- interior, then the rolled rim on top of it -->
    <ellipse cx="400" cy="${rimY}" rx="${rimRx - 10}" ry="${rimRy - 6}" fill="url(#my${id})" opacity="0.9"/>
    <ellipse cx="400" cy="${rimY}" rx="${rimRx}" ry="${rimRy}" fill="none" stroke="#8B949C" stroke-width="7"/>
    <ellipse cx="400" cy="${rimY}" rx="${rimRx}" ry="${rimRy}" fill="none" stroke="#F2F5F7" stroke-width="3.5"/>
    <path d="M${400 - rimRx * 0.62} ${rimY - rimRy * 0.72} A ${rimRx} ${rimRy} 0 0 1 ${400 + rimRx * 0.34} ${rimY - rimRy * 0.94}" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.85"/>
  </g>`;
}

/** A fanned stack of pre-cut sheets, top one lifted and creased. */
function sheets(id) {
  const leaf = (cx, cy, rot, fill, op = 1) => `
    <g transform="rotate(${rot} ${cx} ${cy})" opacity="${op}">
      <rect x="${cx - 150}" y="${cy - 104}" width="300" height="208" rx="4" fill="${fill}" stroke="#8B949C" stroke-width="2"/>
    </g>`;
  return `
  <g>
    ${leaf(400, 506, -7, `url(#my${id})`, 0.75)}
    ${leaf(400, 480, -2.5, `url(#my${id})`, 0.88)}
    ${leaf(400, 452, 2.5, `url(#my${id})`)}
    <!-- lifted top sheet with crease highlights -->
    <g transform="rotate(-9 400 380)">
      <path d="M250 292 L550 276 L556 470 L256 486 Z" fill="url(#mx${id})" stroke="#8B949C" stroke-width="2"/>
      <path d="M296 286 L312 478" stroke="#FFFFFF" stroke-width="3" opacity="0.65"/>
      <path d="M382 281 L394 474" stroke="#9EA7AE" stroke-width="2.5" opacity="0.6"/>
      <path d="M468 277 L482 470" stroke="#FFFFFF" stroke-width="3" opacity="0.55"/>
    </g>
  </g>`;
}

/** Kraft baking paper: warm tone throughout so it never reads as foil. */
function bakingPaper(id) {
  return `
  <g>
    <!-- unrolled tail, curling toward the viewer -->
    <path d="M296 486 C 352 556, 470 570, 560 528 L 566 592 C 456 640, 330 618, 268 546 Z" fill="url(#kr${id})" opacity="0.95" stroke="${KRAFT_DEEP}" stroke-width="2"/>
    <path d="M320 520 C 380 566, 468 576, 546 548" fill="none" stroke="#F0DCC0" stroke-width="3" opacity="0.7"/>

    <!-- the roll -->
    <rect x="272" y="244" width="216" height="268" fill="url(#kr${id})" stroke="${KRAFT_DEEP}" stroke-width="2"/>
    <ellipse cx="380" cy="244" rx="108" ry="32" fill="#E2C69E" stroke="${KRAFT_DEEP}" stroke-width="2"/>
    <ellipse cx="380" cy="244" rx="34" ry="10" fill="#9C7743"/>
    <!-- green belly band, the one brand cue -->
    <rect x="272" y="330" width="216" height="92" fill="url(#band${id})"/>
    ${echo(380, 376, 54, "#EAF3EE", 0.95)}
    <path d="M272 244 L272 512" stroke="${KRAFT_DEEP}" stroke-width="2" opacity="0.5"/>
  </g>`;
}

const svg = (id, stageOpts, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img">` +
  `${defs(id)}${stage(id, stageOpts)}${inner}</svg>`;

const files = {
  // Three cartons, deliberately different proportions: a short household box, a
  // long food-service box, and (below) bare stock rolls for wholesale.
  "foil-roll-household.svg": svg("a", {}, carton("a", { x: 288, y: 296, w: 196, h: 268, d: 56 })),
  "foil-roll-catering.svg": svg(
    "b",
    { sr: 258 },
    carton("b", { x: 250, y: 250, w: 272, h: 318, d: 68, arcs: 1.1 }),
  ),
  "foil-roll-bulk.svg": svg("c", { cy: 360, sy: 616, sr: 252 }, bulk("c")),
  "foil-tray.svg": svg("d", { cy: 400, sy: 588, sr: 206 }, tray("d")),
  "foil-sheets.svg": svg("e", { cy: 392, sy: 626, sr: 216 }, sheets("e")),
  "baking-paper.svg": svg("f", { cy: 360, sy: 636, sr: 224 }, bakingPaper("f")),
};

for (const [name, markup] of Object.entries(files)) {
  writeFileSync(`public/images/placeholders/${name}`, markup);
}
console.log("wrote", Object.keys(files).length, "placeholders");
