/**
 * Posean — frame preset verification (no test framework needed)
 * Run:  npm run frames:verify
 * Exits with code 1 if any check fails.
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Final grid table (single source of truth from the product brief) — independent of the generated config.
const EXPECTED = {
  birthday: { cols: 2, rows: 3 },
  nailong: { cols: 1, rows: 4 },
  "hello-kitty": { cols: 1, rows: 4 },
  "mickey-mouse": { cols: 1, rows: 4 },
  perunggu: { cols: 1, rows: 3 },
  "formula-1": { cols: 1, rows: 3 },
  vintage: { cols: 2, rows: 4 },
  flowers: { cols: 1, rows: 3 },
};

// framePresets.ts is generated TS; parse the JSON array out of it to avoid a TS toolchain.
const src = fs.readFileSync("src/data/framePresets.ts", "utf8");
const json = src.slice(src.indexOf("= [") + 2, src.lastIndexOf("];") + 1);
const PRESETS = JSON.parse(json);

let failed = 0;
const ok = (cond, msg) => { if (!cond) { failed++; console.log("   ✘ " + msg); } return cond; };

ok(PRESETS.length === 8, `expected 8 presets, got ${PRESETS.length}`);

for (const p of PRESETS) {
  console.log(`▶ ${p.id}`);
  const exp = EXPECTED[p.id];
  if (!ok(!!exp, "unknown preset id")) continue;
  ok(p.cols === exp.cols && p.rows === exp.rows, `grid ${p.cols}x${p.rows} != expected ${exp.cols}x${exp.rows}`);
  ok(p.total === exp.cols * exp.rows, `total ${p.total} != ${exp.cols * exp.rows}`);
  ok(p.holes.length === p.total && p.slots.length === p.total, `holes/slots count (${p.holes.length}/${p.slots.length}) != total ${p.total}`);
  ok(p.height > p.width, `not portrait (${p.width}x${p.height})`);
  ok(Math.abs(p.aspectRatio - p.width / p.height) < 0.01, "aspectRatio mismatch");
  ok((p.cols > 1) === (p.type === "grid"), "type should be 'grid' for multi-column frames");
  if (p.type === "strip") ok(p.slots[0].width >= 70 && p.aspectRatio <= 0.45, "strip would trigger legacy Canva auto-trim");

  // all slots same size, consistent grid positions
  const h0 = p.holes[0];
  ok(p.holes.every((h) => h.width === h0.width && h.height === h0.height), "slot sizes differ");
  const xs = [...new Set(p.holes.map((h) => h.x))], ys = [...new Set(p.holes.map((h) => h.y))];
  ok(xs.length === p.cols && ys.length === p.rows, `distinct x/y (${xs.length}/${ys.length}) != cols/rows`);
  ok(p.holes.every((h) => h.x >= 0 && h.y >= 0 && h.x + h.width <= p.width && h.y + h.height <= p.height), "hole outside canvas");

  // asset
  const file = path.join("public", p.image);
  if (!ok(fs.existsSync(file), `missing asset ${file}`)) continue;
  const meta = await sharp(file).metadata();
  ok(meta.format === "png" && meta.hasAlpha, "asset is not a PNG with alpha channel");
  ok(meta.width === p.width && meta.height === p.height, `png ${meta.width}x${meta.height} != config ${p.width}x${p.height}`);

  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const A = (x, y) => data[(y * info.width + x) * 4 + 3];
  const W = info.width, H = info.height;

  // 1) photo holes: every pixel (inset 4px from the rounded edge) must be fully transparent
  const inRounded = (x, y, h, r, inset) => {
    const x0 = h.x + inset, y0 = h.y + inset, x1 = h.x + h.width - inset, y1 = h.y + h.height - inset, rr = Math.max(0, r - inset);
    if (x < x0 || x >= x1 || y < y0 || y >= y1) return false;
    const cx = x < x0 + rr ? x0 + rr : x >= x1 - rr ? x1 - rr : x, cy = y < y0 + rr ? y0 + rr : y >= y1 - rr ? y1 - rr : y;
    return (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr;
  };
  let holeBad = 0, holeChecked = 0;
  for (const h of p.holes) for (let y = h.y; y < h.y + h.height; y++) for (let x = h.x; x < h.x + h.width; x++) if (inRounded(x, y, h, p.holeRadius, 4)) { holeChecked++; if (A(x, y) !== 0) holeBad++; }
  ok(holeChecked > 0 && holeBad === 0, `${holeBad} non-transparent pixels inside photo holes (checked ${holeChecked})`);

  // 2) outer corners transparent, edges opaque
  ok([[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].every(([x, y]) => A(x, y) === 0), "outer corners are not transparent");
  const edge = [];
  for (let t = 0.2; t <= 0.8; t += 0.1) { const x = Math.round(W * t), y = Math.round(H * t); edge.push([x, 6], [x, H - 7], [6, y], [W - 7, y]); }
  ok(edge.every(([x, y]) => A(x, y) === 255), "outer border is not fully opaque");

  // 3) frame body fully opaque everywhere except holes (+3px AA) and the rounded corners
  const inHole = (x, y) => p.holes.some((h) => x >= h.x - 3 && x < h.x + h.width + 3 && y >= h.y - 3 && y < h.y + h.height + 3);
  const nearCorner = (x, y) => (x < 60 || x >= W - 60) && (y < 60 || y >= H - 60);
  let bodyBad = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (A(x, y) !== 255 && !inHole(x, y) && !nearCorner(x, y)) bodyBad++;
  ok(bodyBad === 0, `${bodyBad} semi/transparent pixels in the frame body (border/decor must be opaque)`);

  // 4) border between slots intact (midpoint of every gap)
  for (let r = 0; r < p.rows - 1; r++) for (let c = 0; c < p.cols; c++) {
    const a = p.holes[r * p.cols + c], b = p.holes[(r + 1) * p.cols + c];
    ok(A(a.x + (a.width >> 1), Math.round((a.y + a.height + b.y) / 2)) === 255, `gap between rows ${r}-${r + 1} not opaque`);
  }
  if (p.cols > 1) for (let r = 0; r < p.rows; r++) {
    const a = p.holes[r * p.cols], b = p.holes[r * p.cols + 1];
    ok(A(Math.round((a.x + a.width + b.x) / 2), a.y + (a.height >> 1)) === 255, `gap between columns (row ${r}) not opaque`);
  }

  // 5) slots (live-photo areas) cover their hole and stay inside the canvas
  p.slots.forEach((s, i) => {
    const h = p.holes[i];
    const sx = (s.x / 100) * W, sy = (s.y / 100) * H, sw = (s.width / 100) * W, sh = (s.height / 100) * H;
    ok(sx <= h.x + 0.5 && sy <= h.y + 0.5 && sx + sw >= h.x + h.width - 0.5 && sy + sh >= h.y + h.height - 0.5, `slot ${i} does not cover its hole`);
    ok(sx >= 0 && sy >= 0 && sx + sw <= W + 0.5 && sy + sh <= H + 0.5, `slot ${i} outside canvas`);
  });

  if (failed === 0) console.log(`   ✔ ${p.cols}x${p.rows}=${p.total} slots, ${W}x${H}px, alpha OK`);
}

console.log(failed === 0 ? "\nALL CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
