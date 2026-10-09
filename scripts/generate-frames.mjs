/**
 * Posean — Frame theme generator
 * ------------------------------------------------------------------
 * Generates the 8 preset frame PNGs (true alpha channel) into public/frames
 * and the typed config at src/data/framePresets.ts.
 *
 * Run:  npm run frames:generate
 *
 * How transparency works: every frame is drawn inside a clip-path made of the
 * outer rounded rectangle + every photo hole (fill-rule: evenodd). Anything
 * outside that shape (photo holes, rounded outer corners) is therefore *really*
 * transparent (alpha = 0). Decorations can never leak into a hole.
 *
 * To add a new theme: see "Menambah tema baru" in README.md.
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("public/frames");
const DATA_FILE = path.resolve("src/data/framePresets.ts");
const BLEED = 6; // px the live photo slot extends under the frame border (hides AA seams)

// ---------------------------------------------------------------- helpers
const f = (n) => Math.round(n * 100) / 100;
const rr = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

function layout({ W, cols, rows, M, G, Ht, Hb, aspect = 4 / 3 }) {
  const sw = Math.round((W - 2 * M - (cols - 1) * G) / cols);
  const sh = Math.round(sw / aspect);
  const H = Ht + rows * sh + (rows - 1) * G + Hb;
  const holes = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      holes.push({ x: M + c * (sw + G), y: Ht + r * (sh + G), w: sw, h: sh });
  return { W, H, cols, rows, M, G, Ht, Hb, sw, sh, holes };
}

const star = (cx, cy, r, fill, rot = 0, stroke = "none", sw = 0) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${f(cx + Math.cos(a) * rad)},${f(cy + Math.sin(a) * rad)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" transform="rotate(${rot} ${cx} ${cy})"/>`;
};
const heart = (cx, cy, s, fill, rot = 0) =>
  `<path transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})" d="M0 0.55C-1.1 -0.1 -0.6 -0.95 0 -0.35C0.6 -0.95 1.1 -0.1 0 0.55Z" fill="${fill}"/>`;
const dot = (cx, cy, r, fill, op = 1) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${op}"/>`;
const balloon = (cx, cy, r, color) => `
  <path d="M${cx} ${cy + r * 1.2}q${r * 0.5} ${r * 0.9} -${r * 0.25} ${r * 1.5}t${r * 0.1} ${r * 1.1}" stroke="#9a8a80" stroke-width="2.5" fill="none"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 1.2}" fill="${color}"/>
  <polygon points="${cx - 7},${cy + r * 1.2 + 7} ${cx + 7},${cy + r * 1.2 + 7} ${cx},${cy + r * 1.2 - 2}" fill="${color}"/>
  <ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.45}" rx="${r * 0.16}" ry="${r * 0.3}" fill="#fff" opacity="0.5" transform="rotate(25 ${cx - r * 0.35} ${cy - r * 0.45})"/>`;
const flower = (cx, cy, r, petal, center, n = 5, rot = 0) => {
  let s = `<g transform="translate(${cx} ${cy}) rotate(${rot})">`;
  for (let i = 0; i < n; i++)
    s += `<ellipse cx="0" cy="${-r * 0.6}" rx="${r * 0.4}" ry="${r * 0.62}" fill="${petal}" transform="rotate(${(360 / n) * i})"/>`;
  return s + `<circle r="${r * 0.3}" fill="${center}"/></g>`;
};
const leaf = (cx, cy, len, rot, fill) =>
  `<path transform="translate(${cx} ${cy}) rotate(${rot})" d="M0 0Q${len * 0.5} ${-len * 0.38} ${len} 0Q${len * 0.5} ${len * 0.38} 0 0Z" fill="${fill}"/>`;
const note = (cx, cy, s, fill) =>
  `<g transform="translate(${cx} ${cy}) scale(${s})" fill="${fill}"><ellipse cx="0" cy="0" rx="9" ry="6.5" transform="rotate(-20)"/><rect x="6.5" y="-34" width="3.2" height="34"/><path d="M9.7 -34q16 6 10 22q2 -12 -10 -14z"/></g>`;
const txt = (x, y, s, size, fill, opts = {}) => {
  const { family = "Georgia, serif", weight = "bold", style = "normal", anchor = "middle", ls = 0, stroke, sw = 0, skew = 0 } = opts;
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" font-style="${style}" text-anchor="${anchor}" letter-spacing="${ls}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke"` : ""}${skew ? ` transform="translate(${x} ${y}) skewX(${skew}) translate(${-x} ${-y})"` : ""}>${s}</text>`;
};

function compose(L, radius, holeR, content) {
  const body = [rr(0, 0, L.W, L.H, radius), ...L.holes.map((h) => rr(h.x, h.y, h.w, h.h, holeR))].join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}">
<defs>
  <clipPath id="body"><path d="${body}" clip-rule="evenodd"/></clipPath>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0.55 -0.12"/>
  </filter>
</defs>
<g clip-path="url(#body)">
${content}
</g>
</svg>`;
}
const holeOutline = (L, holeR, color, w) =>
  `<path d="${L.holes.map((h) => rr(h.x, h.y, h.w, h.h, holeR)).join("")}" fill="none" stroke="${color}" stroke-width="${w * 2}"/>`;
const border = (L, radius, color, w, inset = 0) =>
  `<rect x="${inset + w / 2}" y="${inset + w / 2}" width="${L.W - 2 * inset - w}" height="${L.H - 2 * inset - w}" rx="${Math.max(2, radius - inset - w / 2)}" fill="none" stroke="${color}" stroke-width="${w}"/>`;

// ---------------------------------------------------------------- characters (all original artwork)
const dinoHead = (cx, cy, s) => `<g transform="translate(${cx} ${cy}) scale(${s})">
  <polygon points="-52,-52 -34,-100 -14,-62" fill="#FF9F43"/><polygon points="-14,-66 4,-112 24,-66" fill="#FF9F43"/><polygon points="22,-62 42,-98 56,-48" fill="#FF9F43"/>
  <ellipse rx="88" ry="74" fill="#FFD84A" stroke="#E8A33D" stroke-width="6"/>
  <ellipse cx="0" cy="26" rx="46" ry="30" fill="#FFF2BC"/>
  <ellipse cx="-56" cy="14" rx="15" ry="10" fill="#FF9DB5" opacity="0.85"/><ellipse cx="56" cy="14" rx="15" ry="10" fill="#FF9DB5" opacity="0.85"/>
  <circle cx="-34" cy="-8" r="10" fill="#2b2118"/><circle cx="34" cy="-8" r="10" fill="#2b2118"/>
  <circle cx="-31" cy="-12" r="3.5" fill="#fff"/><circle cx="37" cy="-12" r="3.5" fill="#fff"/>
  <circle cx="-8" cy="14" r="2.5" fill="#B9791F"/><circle cx="8" cy="14" r="2.5" fill="#B9791F"/>
  <path d="M-16 30Q0 46 16 30" stroke="#8a4b12" stroke-width="4.5" fill="none" stroke-linecap="round"/>
</g>`;
const kittyHead = (cx, cy, s) => `<g transform="translate(${cx} ${cy}) scale(${s})" stroke="#3a3238" stroke-width="5" stroke-linejoin="round">
  <polygon points="-92,-18 -88,-86 -36,-60" fill="#fff"/><polygon points="92,-18 88,-86 36,-60" fill="#fff"/>
  <ellipse rx="100" ry="74" fill="#fff"/>
  <g stroke="none"><ellipse cx="-44" cy="4" rx="8" ry="10" fill="#3a3238"/><ellipse cx="44" cy="4" rx="8" ry="10" fill="#3a3238"/><ellipse cx="0" cy="24" rx="10" ry="7" fill="#FFD23F"/></g>
  <g fill="none" stroke-linecap="round"><path d="M-72 14L-122 4"/><path d="M-72 28L-124 32"/><path d="M-70 40L-116 58"/><path d="M72 14L122 4"/><path d="M72 28L124 32"/><path d="M70 40L116 58"/></g>
  <g stroke="#d6577d" stroke-width="4"><polygon points="62,-62 112,-92 108,-40" fill="#FF7FA8"/><polygon points="62,-62 22,-96 20,-42" fill="#FF7FA8"/><circle cx="62" cy="-64" r="14" fill="#FF5C8F"/></g>
</g>`;
const glove = (cx, cy, s, flip = 1) => `<g transform="translate(${cx} ${cy}) scale(${s * flip} ${s})" fill="#fff" stroke="#111" stroke-width="5" stroke-linejoin="round">
  <rect x="-34" y="20" width="68" height="34" rx="10" fill="#fff"/>
  <path d="M-34 24V-18Q-34 -34 -20 -34Q-8 -34 -8 -18V-40Q-8 -56 6 -56Q20 -56 20 -40V-18Q20 -50 34 -50Q46 -50 46 -34V24Z"/>
  <path d="M-34 -2Q-60 -6 -56 12Q-52 28 -34 24Z"/>
  <line x1="-6" y1="-14" x2="-6" y2="14" stroke-width="3"/><line x1="18" y1="-14" x2="18" y2="14" stroke-width="3"/>
</g>`;

// ---------------------------------------------------------------- themes
const THEMES = [];

THEMES.push({
  id: "birthday", file: "birthday.png", name: "Birthday", description: "Ulang tahun pastel yang ceria dengan balon, bunting, dan kue.",
  bg_color: "#FFF3E2", text_color: "#E85D8A", badge: "Birthday",
  layout: layout({ W: 1200, cols: 2, rows: 3, M: 60, G: 36, Ht: 240, Hb: 150 }), radius: 44, holeR: 22,
  draw(L) {
    const pastel = ["#F7A8C4", "#FFD966", "#BDE8D8", "#A9D6F5", "#FFC6A5"];
    let s = `<rect width="${L.W}" height="${L.H}" fill="#FFF3E2"/>`;
    for (let i = 0; i < 36; i++) s += dot(30 + ((i * 197) % (L.W - 60)), 20 + ((i * 331) % (L.H - 40)), 5, pastel[i % 5], 0.45);
    s += `<path d="M70 38Q600 96 1130 38" stroke="#E7B7A5" stroke-width="3" fill="none"/>`;
    for (let i = 0; i < 13; i++) {
      const t = i / 12; const x = 70 + t * 1060; const y = 38 + 116 * t * (1 - t); // quad curve y
      s += `<polygon points="${f(x - 26)},${f(y - 2)} ${f(x + 26)},${f(y - 2)} ${f(x)},${f(y + 52)}" fill="${pastel[i % 5]}" stroke="#fff" stroke-width="3"/>`;
    }
    s += txt(600, 196, "Happy Birthday", 90, "#E85D8A", { style: "italic", stroke: "#fff", sw: 10 });
    s += balloon(112, 148, 36, "#F7A8C4") + balloon(1088, 148, 36, "#A9D6F5");
    s += star(190, 128, 13, "#FFD966", 12) + star(1010, 128, 13, "#FFD966", -12);
    // footer cake
    const fy = L.H - L.Hb;
    s += `<rect x="520" y="${fy + 70}" width="160" height="46" rx="10" fill="#F7A8C4"/><rect x="540" y="${fy + 36}" width="120" height="36" rx="9" fill="#FFC6A5"/>
      <path d="M520 ${fy + 86}q20 16 40 0t40 0t40 0t40 0" stroke="#fff" stroke-width="6" fill="none"/>
      <rect x="595" y="${fy + 14}" width="10" height="24" rx="3" fill="#A9D6F5"/><path d="M600 ${fy + 2}q9 11 0 18q-9 -7 0 -18z" fill="#FFB020"/>`;
    s += txt(280, fy + 92, "make a wish", 46, "#E85D8A", { style: "italic", weight: "normal" });
    s += txt(920, fy + 92, "make it sweet", 46, "#E85D8A", { style: "italic", weight: "normal" });
    s += star(120, fy + 70, 16, "#FFD966", 8) + star(1080, fy + 70, 16, "#BDE8D8", -8) + heart(430, fy + 70, 16, "#F7A8C4") + heart(770, fy + 70, 16, "#F7A8C4");
    s += holeOutline(L, 22, "#F7A8C4", 12) + holeOutline(L, 22, "#fff", 6);
    s += border(L, 44, "#F7A8C4", 22) + border(L, 44, "#fff", 8, 26);
    return s;
  },
});

THEMES.push({
  id: "nailong", file: "nailong.png", name: "Nailong", description: "Dino kuning menggemaskan (karakter orisinal bergaya Nailong).",
  bg_color: "#FFE9A0", text_color: "#C2570C", badge: "Cute",
  layout: layout({ W: 900, cols: 1, rows: 4, M: 60, G: 30, Ht: 210, Hb: 210 }), radius: 44, holeR: 20,
  draw(L) {
    let s = `<rect width="${L.W}" height="${L.H}" fill="#FFE27A"/><rect x="26" y="26" width="${L.W - 52}" height="${L.H - 52}" rx="30" fill="#FFF1BD"/>`;
    for (let i = 0; i < 40; i++) s += star(40 + ((i * 211) % (L.W - 80)), 30 + ((i * 523) % (L.H - 60)), 8, "#FFC93C", i * 20);
    s += dinoHead(130, 112, 0.62) + dinoHead(770, 112, 0.62);
    s += txt(450, 140, "NAILONG", 88, "#E8730C", { family: "Trebuchet MS, Verdana, sans-serif", ls: 3, stroke: "#fff", sw: 14 });
    const fy = L.H - L.Hb;
    s += dinoHead(450, fy + 108, 0.95);
    s += txt(205, fy + 118, "so cute!", 54, "#E8730C", { family: "Trebuchet MS, Verdana, sans-serif" });
    s += txt(700, fy + 118, "bong!", 54, "#E8730C", { family: "Trebuchet MS, Verdana, sans-serif" });
    s += star(70, fy + 150, 20, "#FF9F43", 10) + star(830, fy + 150, 20, "#FF9F43", -10) + heart(110, fy + 70, 18, "#FF9DB5") + heart(790, fy + 70, 18, "#FF9DB5");
    s += holeOutline(L, 20, "#E8A33D", 10) + holeOutline(L, 20, "#fff", 5);
    s += border(L, 44, "#F7B267", 26);
    return s;
  },
});

THEMES.push({
  id: "hello-kitty", file: "hello-kitty.png", name: "Hello Kitty", description: "Kawaii pink dengan kucing putih berpita (karakter orisinal bergaya kawaii).",
  bg_color: "#FFE3EC", text_color: "#D6366B", badge: "Kawaii",
  layout: layout({ W: 900, cols: 1, rows: 4, M: 60, G: 30, Ht: 210, Hb: 210 }), radius: 44, holeR: 20,
  draw(L) {
    let s = `<rect width="${L.W}" height="${L.H}" fill="#FFD3E2"/><rect x="24" y="24" width="${L.W - 48}" height="${L.H - 48}" rx="30" fill="#FFE9F0"/>`;
    for (let i = 0; i < 34; i++) s += heart(40 + ((i * 223) % (L.W - 80)), 40 + ((i * 487) % (L.H - 80)), 11, "#FFB6CD", ((i * 37) % 40) - 20);
    s += kittyHead(450, 112, 0.9);
    s += flower(200, 100, 26, "#FFB6CD", "#FFD23F", 6) + flower(700, 100, 26, "#FFB6CD", "#FFD23F", 6);
    s += heart(110, 150, 22, "#FF7FA8") + heart(790, 150, 22, "#FF7FA8") + heart(300, 60, 14, "#FF7FA8") + heart(600, 60, 14, "#FF7FA8");
    const fy = L.H - L.Hb;
    s += txt(450, fy + 110, "Pretty in Pink", 78, "#D6366B", { style: "italic", stroke: "#fff", sw: 12 });
    s += heart(130, fy + 100, 28, "#FF7FA8") + heart(770, fy + 100, 28, "#FF7FA8");
    s += flower(240, fy + 160, 20, "#FFB6CD", "#FFD23F", 5) + flower(450, fy + 170, 20, "#FFB6CD", "#FFD23F", 5) + flower(660, fy + 160, 20, "#FFB6CD", "#FFD23F", 5);
    s += holeOutline(L, 20, "#fff", 10) + holeOutline(L, 20, "#FF9DBD", 5);
    s += border(L, 44, "#fff", 22) + border(L, 44, "#FF9DBD", 8);
    return s;
  },
});

THEMES.push({
  id: "mickey-mouse", file: "mickey-mouse.png", name: "Mickey Mouse", description: "Kartun klasik merah-hitam-kuning dengan sarung tangan dan bintang (desain orisinal).",
  bg_color: "#E3262E", text_color: "#FFD23F", badge: "Classic",
  layout: layout({ W: 900, cols: 1, rows: 4, M: 60, G: 30, Ht: 210, Hb: 210 }), radius: 44, holeR: 20,
  draw(L) {
    let s = `<rect width="${L.W}" height="${L.H}" fill="#E3262E"/>`;
    for (let y = 40; y < L.H; y += 70) for (let x = (y / 70) % 2 ? 40 : 75; x < L.W; x += 70) s += dot(x, y, 12, "#fff", 0.16);
    s += star(120, 105, 34, "#FFD23F", 10, "#111", 5) + star(780, 105, 34, "#FFD23F", -10, "#111", 5);
    s += txt(450, 150, "FUN TIME!", 118, "#FFD23F", { family: "Impact, Arial Black, sans-serif", ls: 3, stroke: "#111", sw: 14, skew: -6 });
    const fy = L.H - L.Hb;
    s += glove(130, fy + 100, 1.15) + glove(770, fy + 100, 1.15, -1);
    s += txt(450, fy + 108, "CLASSIC", 62, "#fff", { family: "Impact, Arial Black, sans-serif", ls: 6, stroke: "#111", sw: 10 });
    s += txt(450, fy + 170, "CARTOON FUN", 50, "#FFD23F", { family: "Impact, Arial Black, sans-serif", ls: 5, stroke: "#111", sw: 9 });
    s += dot(300, fy + 60, 15, "#FFD23F") + dot(600, fy + 60, 15, "#FFD23F");
    s += holeOutline(L, 20, "#111", 12) + holeOutline(L, 20, "#FFD23F", 5);
    s += border(L, 44, "#111", 26) + border(L, 44, "#FFD23F", 6, 26);
    return s;
  },
});

THEMES.push({
  id: "perunggu", file: "perunggu.png", name: "Band Perunggu", description: "Editorial alternatif Indonesia: kertas, grain film, garis tipis, earth tone.",
  bg_color: "#D9CFBD", text_color: "#2B2118", badge: "Indie",
  layout: layout({ W: 900, cols: 1, rows: 3, M: 60, G: 30, Ht: 190, Hb: 230 }), radius: 28, holeR: 8,
  draw(L) {
    let s = `<rect width="${L.W}" height="${L.H}" fill="#D9CFBD"/><rect width="${L.W}" height="${L.H}" filter="url(#grain)" opacity="0.55"/>`;
    s += `<rect x="26" y="26" width="${L.W - 52}" height="${L.H - 52}" fill="none" stroke="#5B4636" stroke-width="2"/>`;
    s += txt(450, 76, "ALTERNATIVE  ·  LIVE SESSION", 28, "#5B4636", { family: "Courier New, monospace", ls: 7, weight: "bold" });
    s += `<line x1="70" y1="98" x2="830" y2="98" stroke="#2B2118" stroke-width="3"/><line x1="70" y1="106" x2="830" y2="106" stroke="#2B2118" stroke-width="1"/>`;
    s += txt(450, 158, "VOL. 01", 50, "#2B2118", { family: "Courier New, monospace", ls: 10 });
    const fy = L.H - L.Hb;
    for (let i = 0; i < 5; i++) s += `<line x1="70" y1="${fy + 40 + i * 9}" x2="830" y2="${fy + 40 + i * 9}" stroke="#2B2118" stroke-width="1.6" opacity="0.8"/>`;
    s += note(150, fy + 52, 1.3, "#2B2118") + note(300, fy + 70, 1.3, "#7A5A3A") + note(620, fy + 56, 1.3, "#2B2118") + note(760, fy + 72, 1.3, "#7A5A3A");
    s += txt(70, fy + 135, "SIDE A — 3 FRAMES", 26, "#2B2118", { family: "Courier New, monospace", anchor: "start", ls: 4 });
    s += txt(830, fy + 135, "NO. 0001", 26, "#7A5A3A", { family: "Courier New, monospace", anchor: "end", ls: 4 });
    let bx = 70; for (let i = 0; bx < 330; i++) { const w = 2 + ((i * 7) % 5); s += `<rect x="${bx}" y="${fy + 155}" width="${w}" height="44" fill="#2B2118"/>`; bx += w + 3 + ((i * 3) % 4); }
    s += txt(830, fy + 190, "fan frame · unofficial", 20, "#5B4636", { family: "Courier New, monospace", anchor: "end", weight: "normal" });
    s += holeOutline(L, 8, "#2B2118", 12) + holeOutline(L, 8, "#F4EEE2", 4);
    s += border(L, 28, "#2B2118", 16);
    return s;
  },
});

THEMES.push({
  id: "formula-1", file: "formula-1.png", name: "Formula 1", description: "Motorsport merah-hitam dengan bendera kotak-kotak dan garis kecepatan.",
  bg_color: "#141414", text_color: "#FFFFFF", badge: "Racing",
  layout: layout({ W: 900, cols: 1, rows: 3, M: 60, G: 30, Ht: 190, Hb: 230 }), radius: 28, holeR: 6,
  draw(L) {
    const checker = (y) => { let c = ""; for (let r = 0; r < 2; r++) for (let i = 0; i < 38; i++) if ((i + r) % 2 === 0) c += `<rect x="${40 + i * 21.5}" y="${y + r * 21}" width="21.5" height="21" fill="#fff"/>`; return c; };
    let s = `<rect width="${L.W}" height="${L.H}" fill="#141414"/>`;
    for (let i = 0; i < 6; i++) s += `<polygon points="${-100 + i * 190},${L.H} ${-40 + i * 190},${L.H} ${260 + i * 190},0 ${200 + i * 190},0" fill="#E10600" opacity="0.1"/>`;
    s += checker(26) + `<rect x="40" y="26" width="817" height="42" fill="none" stroke="#fff" stroke-width="2"/>`;
    s += `<polygon points="60,104 330,104 300,170 60,170" fill="#E10600"/><polygon points="840,104 600,104 570,170 840,170" fill="#E10600"/>`;
    s += txt(450, 160, "RACE DAY", 90, "#fff", { family: "Impact, Arial Black, sans-serif", ls: 4, skew: -10 });
    const fy = L.H - L.Hb;
    s += `<polygon points="60,${fy + 24} 520,${fy + 24} 490,${fy + 54} 60,${fy + 54}" fill="#E10600"/><polygon points="540,${fy + 24} 840,${fy + 24} 840,${fy + 54} 510,${fy + 54}" fill="#fff" opacity="0.9"/>`;
    s += txt(450, fy + 125, "FASTEST LAP", 74, "#fff", { family: "Impact, Arial Black, sans-serif", ls: 3, skew: -10 });
    s += txt(450, fy + 152, "P1  ·  3 LAPS  ·  GRID START", 20, "#9a9a9a", { family: "Arial, sans-serif", ls: 6, weight: "bold" });
    s += checker(L.H - 70);
    s += holeOutline(L, 6, "#E10600", 12) + holeOutline(L, 6, "#fff", 4);
    s += border(L, 28, "#E10600", 16);
    return s;
  },
});

THEMES.push({
  id: "vintage", file: "vintage.png", name: "Vintage", description: "Retro film analog dalam tone beige & cokelat, 8 foto.",
  bg_color: "#EFE3CC", text_color: "#5A3E26", badge: "Retro",
  layout: layout({ W: 1200, cols: 2, rows: 4, M: 70, G: 30, Ht: 170, Hb: 170 }), radius: 28, holeR: 6,
  draw(L) {
    let s = `<rect width="${L.W}" height="${L.H}" fill="#EFE3CC"/><rect width="${L.W}" height="${L.H}" filter="url(#grain)" opacity="0.5"/>`;
    s += `<rect x="24" y="24" width="${L.W - 48}" height="${L.H - 48}" fill="none" stroke="#7A5A3A" stroke-width="2"/>`;
    // film perforations in side margins (solid ink, not transparent)
    for (let y = 190; y < L.H - 190; y += 56) s += `<rect x="26" y="${y}" width="22" height="30" rx="5" fill="#5A3E26"/><rect x="${L.W - 48}" y="${y}" width="22" height="30" rx="5" fill="#5A3E26"/>`;
    s += txt(600, 98, "ANALOG MEMORIES", 66, "#5A3E26", { ls: 8 });
    s += `<line x1="120" y1="132" x2="470" y2="132" stroke="#7A5A3A" stroke-width="2"/><line x1="730" y1="132" x2="1080" y2="132" stroke="#7A5A3A" stroke-width="2"/>`;
    s += txt(600, 140, "— 35MM FILM —", 26, "#7A5A3A", { family: "Courier New, monospace", ls: 6 });
    const fy = L.H - L.Hb;
    s += txt(600, fy + 82, "keep the moment", 52, "#5A3E26", { style: "italic", weight: "normal" });
    s += `<line x1="120" y1="${fy + 30}" x2="1080" y2="${fy + 30}" stroke="#7A5A3A" stroke-width="2"/>`;
    s += txt(120, fy + 132, "8 FRAMES", 24, "#7A5A3A", { family: "Courier New, monospace", anchor: "start", ls: 5 });
    s += txt(1080, fy + 132, "EST. 1974", 24, "#7A5A3A", { family: "Courier New, monospace", anchor: "end", ls: 5 });
    s += holeOutline(L, 6, "#5A3E26", 10) + holeOutline(L, 6, "#FBF5E8", 4);
    s += border(L, 28, "#7A5A3A", 14);
    return s;
  },
});

THEMES.push({
  id: "flowers", file: "flowers.png", name: "Flowers", description: "Floral lembut: krem, sage, pink pastel, dan lavender.",
  bg_color: "#FBF7EF", text_color: "#5E7F5A", badge: "Floral",
  layout: layout({ W: 900, cols: 1, rows: 3, M: 60, G: 30, Ht: 190, Hb: 190 }), radius: 40, holeR: 22,
  draw(L) {
    const P = ["#F7B6CB", "#C9B6F0", "#FFD6A8", "#F9C9D8"];
    let s = `<rect width="${L.W}" height="${L.H}" fill="#FBF7EF"/>`;
    const cluster = (cx, cy, k = 1) => leaf(cx - 40 * k, cy + 12 * k, 56 * k, 200, "#A8C2A0") + leaf(cx + 40 * k, cy + 14 * k, 56 * k, -20, "#9DBB95") + leaf(cx, cy + 34 * k, 50 * k, 90, "#B7CEB0") +
      flower(cx - 18 * k, cy - 14 * k, 30 * k, P[0], "#FFE08A", 6) + flower(cx + 26 * k, cy - 4 * k, 24 * k, P[1], "#FFE08A", 5, 20) + flower(cx + 2 * k, cy + 16 * k, 18 * k, P[2], "#fff", 5, 10);
    s += cluster(140, 100) + cluster(760, 100);
    s += txt(450, 138, "Bloom", 112, "#5E7F5A", { style: "italic", stroke: "#FBF7EF", sw: 10 });
    const fy = L.H - L.Hb;
    s += cluster(140, fy + 100) + cluster(760, fy + 100);
    s += txt(450, fy + 112, "in full bloom", 56, "#7C9A78", { style: "italic", weight: "normal" });
    for (let y = 250; y < fy - 40; y += 150) {
      const c = (y / 150) | 0;
      s += leaf(39, y + 6, 15, -60, "#A8C2A0") + leaf(39, y + 34, 15, 60, "#B7CEB0") + flower(39, y + 20, 9, P[c % 4], "#FFE08A", 5);
      s += leaf(L.W - 39, y + 6, 15, 240, "#A8C2A0") + leaf(L.W - 39, y + 34, 15, 120, "#B7CEB0") + flower(L.W - 39, y + 20, 9, P[(c + 2) % 4], "#FFE08A", 5);
    }
    s += holeOutline(L, 22, "#C9B6F0", 10) + holeOutline(L, 22, "#fff", 5);
    s += border(L, 40, "#B7C9A8", 20) + border(L, 40, "#C9B6F0", 4, 20);
    return s;
  },
});

// ---------------------------------------------------------------- run
fs.mkdirSync(OUT_DIR, { recursive: true });
const presets = [];
for (const t of THEMES) {
  const L = t.layout;
  const svg = compose(L, t.radius, t.holeR, t.draw(L));
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(path.join(OUT_DIR, t.file));
  const base = L.cols > 1 ? 380 : 300; // editor preview base width for grid / strip
  presets.push({
    id: t.id, name: t.name, description: t.description, image: `/frames/${t.file}`,
    cols: L.cols, rows: L.rows, total: L.cols * L.rows,
    width: L.W, height: L.H, aspectRatio: f(L.W / L.H), holeRadius: t.holeR,
    type: L.cols > 1 ? "grid" : "strip",
    bg_color: t.bg_color, text_color: t.text_color, badge: t.badge,
    holes: L.holes.map((h) => ({ x: h.x, y: h.y, width: h.w, height: h.h })),
    slots: L.holes.map((h) => ({
      x: f(((h.x - BLEED) / L.W) * 100), y: f(((h.y - BLEED) / L.H) * 100),
      width: f(((h.w + 2 * BLEED) / L.W) * 100), height: f(((h.h + 2 * BLEED) / L.H) * 100),
    })),
  });
  console.log(`✔ ${t.file}  ${L.W}x${L.H}  ${L.cols}x${L.rows}`);
}

const header = `/**
 * AUTO-GENERATED by scripts/generate-frames.mjs — do not edit by hand.
 * Re-generate with: npm run frames:generate
 */
import type { CustomSlot } from "@/types/template";

export interface FramePresetRect { x: number; y: number; width: number; height: number }

export interface FramePreset {
  id: string;
  name: string;
  description: string;
  /** Transparent PNG (alpha channel) overlay, served from /public/frames */
  image: string;
  cols: number;
  rows: number;
  /** cols * rows — must equal slots.length */
  total: number;
  /** Canvas size in px */
  width: number;
  height: number;
  /** Corner radius (px) of every photo hole */
  holeRadius: number;
  /** width / height */
  aspectRatio: number;
  type: "strip" | "grid";
  bg_color: string;
  text_color: string;
  badge: string;
  /** Exact transparent photo holes in canvas px (row-major: left→right, top→bottom) */
  holes: FramePresetRect[];
  /** Same holes in % of the canvas, enlarged by a few px so photos tuck under the border (no seams) */
  slots: CustomSlot[];
}

export const FRAME_PRESETS: FramePreset[] = ${JSON.stringify(presets, null, 2)};
`;
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
fs.writeFileSync(DATA_FILE, header);
console.log("✔ wrote", path.relative(process.cwd(), DATA_FILE));
