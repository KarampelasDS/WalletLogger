// Icon generator — rasterizes the Ionicons "wallet" glyph (the same icon shown on
// the onboarding screen) onto the brand-purple background. No runtime deps.
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const BG = [115, 75, 233];   // #734BE9 brand purple
const FG = [255, 255, 255];  // white wallet

// Ionicons 7 "wallet" (viewBox 0 0 512 512) — two <path> elements, nonzero fill.
const WALLET_PATHS = [
  "M95.5 104h320a87.73 87.73 0 0111.18.71 66 66 0 00-77.51-55.56L86 94.08h-.3a66 66 0 00-41.07 26.13A87.57 87.57 0 0195.5 104zM415.5 128h-320a64.07 64.07 0 00-64 64v192a64.07 64.07 0 0064 64h320a64.07 64.07 0 0064-64V192a64.07 64.07 0 00-64-64zM368 320a32 32 0 1132-32 32 32 0 01-32 32z",
  "M32 259.5V160c0-21.67 12-58 53.65-65.87C121 87.5 156 87.5 156 87.5s23 16 4 16-18.5 24.5 0 24.5 0 23.5 0 23.5L85.5 236z",
];

// ---- canvas ------------------------------------------------------------------
function makeCanvas(w, h) { return { w, h, data: new Float32Array(w * h * 4) }; }
function fillBg(c, [r, g, b], a = 1) {
  for (let i = 0; i < c.w * c.h; i++) {
    c.data[i * 4] = r / 255; c.data[i * 4 + 1] = g / 255;
    c.data[i * 4 + 2] = b / 255; c.data[i * 4 + 3] = a;
  }
}
function blend(c, x, y, [r, g, b], cov) {
  if (cov <= 0 || x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  const sa = cov, da = c.data[i + 3], oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  c.data[i] = (r / 255 * sa + c.data[i] * da * (1 - sa)) / oa;
  c.data[i + 1] = (g / 255 * sa + c.data[i + 1] * da * (1 - sa)) / oa;
  c.data[i + 2] = (b / 255 * sa + c.data[i + 2] * da * (1 - sa)) / oa;
  c.data[i + 3] = oa;
}
function roundRect(c, color, x0, y0, x1, y1, rad) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = (x1 - x0) / 2, hh = (y1 - y0) / 2;
  for (let y = Math.floor(y0 - 2); y <= Math.ceil(y1 + 2); y++)
    for (let x = Math.floor(x0 - 2); x <= Math.ceil(x1 + 2); x++) {
      const qx = Math.abs(x + 0.5 - cx) - (hw - rad), qy = Math.abs(y + 0.5 - cy) - (hh - rad);
      const sd = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
      blend(c, x, y, color, Math.max(0, Math.min(1, 0.5 - sd)));
    }
}

// ---- SVG path parsing → flattened subpaths -----------------------------------
function parsePath(d) {
  let i = 0;
  const isNum = (ch) => ch >= "0" && ch <= "9";
  const skip = () => { while (i < d.length && " ,\t\n\r".includes(d[i])) i++; };
  const num = () => {
    skip(); const st = i;
    if (d[i] === "+" || d[i] === "-") i++;
    while (i < d.length && isNum(d[i])) i++;
    if (d[i] === ".") { i++; while (i < d.length && isNum(d[i])) i++; }
    if (d[i] === "e" || d[i] === "E") { i++; if (d[i] === "+" || d[i] === "-") i++; while (i < d.length && isNum(d[i])) i++; }
    return parseFloat(d.slice(st, i));
  };
  const flag = () => { skip(); const c = d[i]; i++; return c === "1" ? 1 : 0; };

  const subs = [];
  let pts = [];
  let cx = 0, cy = 0, sx = 0, sy = 0;
  let cmd = "", prevCmd = "", pcx = 0, pcy = 0;

  const push = (x, y) => pts.push([x, y]);
  const cubic = (x1, y1, x2, y2, x, y) => {
    const n = 24;
    for (let t = 1; t <= n; t++) {
      const u = t / n, m = 1 - u;
      push(
        m*m*m*cx + 3*m*m*u*x1 + 3*m*u*u*x2 + u*u*u*x,
        m*m*m*cy + 3*m*m*u*y1 + 3*m*u*u*y2 + u*u*u*y
      );
    }
  };
  const quad = (x1, y1, x, y) => {
    const n = 18;
    for (let t = 1; t <= n; t++) {
      const u = t / n, m = 1 - u;
      push(m*m*cx + 2*m*u*x1 + u*u*x, m*m*cy + 2*m*u*y1 + u*u*y);
    }
  };
  const arc = (rx, ry, xrot, large, sweep, x, y) => {
    rx = Math.abs(rx); ry = Math.abs(ry);
    if (rx === 0 || ry === 0) { push(x, y); return; }
    const phi = (xrot * Math.PI) / 180, cosP = Math.cos(phi), sinP = Math.sin(phi);
    const dx = (cx - x) / 2, dy = (cy - y) / 2;
    const x1p = cosP * dx + sinP * dy, y1p = -sinP * dx + cosP * dy;
    let r2 = (rx*rx*ry*ry - rx*rx*y1p*y1p - ry*ry*x1p*x1p) / (rx*rx*y1p*y1p + ry*ry*x1p*x1p);
    r2 = Math.sqrt(Math.max(0, r2));
    if (large === sweep) r2 = -r2;
    const cxp = r2 * (rx * y1p) / ry, cyp = r2 * -(ry * x1p) / rx;
    const ccx = cosP * cxp - sinP * cyp + (cx + x) / 2;
    const ccy = sinP * cxp + cosP * cyp + (cy + y) / 2;
    const ang = (ux, uy, vx, vy) => {
      const dot = ux*vx + uy*vy, len = Math.hypot(ux,uy)*Math.hypot(vx,vy);
      let a = Math.acos(Math.max(-1, Math.min(1, dot / len)));
      if (ux*vy - uy*vx < 0) a = -a; return a;
    };
    let theta = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let delta = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sweep && delta > 0) delta -= 2 * Math.PI;
    if (sweep && delta < 0) delta += 2 * Math.PI;
    const n = Math.max(2, Math.ceil(Math.abs(delta) / (Math.PI / 24)));
    for (let k = 1; k <= n; k++) {
      const t = theta + delta * (k / n);
      const ex = cosP * rx * Math.cos(t) - sinP * ry * Math.sin(t) + ccx;
      const ey = sinP * rx * Math.cos(t) + cosP * ry * Math.sin(t) + ccy;
      push(ex, ey);
    }
  };

  while (i < d.length) {
    skip(); if (i >= d.length) break;
    const ch = d[i];
    if (/[A-Za-z]/.test(ch)) { cmd = ch; i++; }
    else if (cmd === "M") cmd = "L";
    else if (cmd === "m") cmd = "l";
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();

    if (C === "M") {
      if (pts.length) subs.push(pts);
      let x = num(), y = num();
      if (rel) { x += cx; y += cy; }
      pts = []; cx = sx = x; cy = sy = y; push(cx, cy);
    } else if (C === "L") {
      let x = num(), y = num(); if (rel) { x += cx; y += cy; }
      cx = x; cy = y; push(cx, cy);
    } else if (C === "H") {
      let x = num(); if (rel) x += cx; cx = x; push(cx, cy);
    } else if (C === "V") {
      let y = num(); if (rel) y += cy; cy = y; push(cx, cy);
    } else if (C === "C") {
      let x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
      if (rel) { x1+=cx; y1+=cy; x2+=cx; y2+=cy; x+=cx; y+=cy; }
      cubic(x1, y1, x2, y2, x, y); pcx = x2; pcy = y2; cx = x; cy = y;
    } else if (C === "S") {
      let x2 = num(), y2 = num(), x = num(), y = num();
      if (rel) { x2+=cx; y2+=cy; x+=cx; y+=cy; }
      const rfx = (prevCmd === "C" || prevCmd === "S") ? 2*cx - pcx : cx;
      const rfy = (prevCmd === "C" || prevCmd === "S") ? 2*cy - pcy : cy;
      cubic(rfx, rfy, x2, y2, x, y); pcx = x2; pcy = y2; cx = x; cy = y;
    } else if (C === "Q") {
      let x1 = num(), y1 = num(), x = num(), y = num();
      if (rel) { x1+=cx; y1+=cy; x+=cx; y+=cy; }
      quad(x1, y1, x, y); pcx = x1; pcy = y1; cx = x; cy = y;
    } else if (C === "T") {
      let x = num(), y = num(); if (rel) { x+=cx; y+=cy; }
      const rfx = (prevCmd === "Q" || prevCmd === "T") ? 2*cx - pcx : cx;
      const rfy = (prevCmd === "Q" || prevCmd === "T") ? 2*cy - pcy : cy;
      quad(rfx, rfy, x, y); pcx = rfx; pcy = rfy; cx = x; cy = y;
    } else if (C === "A") {
      const rx = num(), ry = num(), xr = num(), la = flag(), sw = flag();
      let x = num(), y = num(); if (rel) { x+=cx; y+=cy; }
      arc(rx, ry, xr, la, sw, x, y); cx = x; cy = y;
    } else if (C === "Z") {
      push(sx, sy); subs.push(pts); pts = []; cx = sx; cy = sy;
    }
    prevCmd = C;
  }
  if (pts.length) subs.push(pts);
  return subs;
}

// ---- nonzero scanline fill with supersampled AA ------------------------------
function fillGlyph(c, pathStrings, scaleFrac, color) {
  // Flatten every subpath first so we can centre on the glyph's true bounding box
  // (the SVG viewBox centre is not the content centre, which made it sit high).
  const subpaths = [];
  let gx0 = 1e9, gy0 = 1e9, gx1 = -1e9, gy1 = -1e9;
  for (const d of pathStrings) {
    for (const sp of parsePath(d)) {
      subpaths.push(sp);
      for (const [x, y] of sp) {
        gx0 = Math.min(gx0, x); gx1 = Math.max(gx1, x);
        gy0 = Math.min(gy0, y); gy1 = Math.max(gy1, y);
      }
    }
  }
  const gw = gx1 - gx0, gh = gy1 - gy0;
  const gcx = (gx0 + gx1) / 2, gcy = (gy0 + gy1) / 2;
  const scale = (scaleFrac * c.w) / Math.max(gw, gh);
  const tx = (x) => c.w / 2 + (x - gcx) * scale;
  const ty = (y) => c.h / 2 + (y - gcy) * scale;

  const edges = [];
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const sp of subpaths) {
    const P = sp.map(([x, y]) => [tx(x), ty(y)]);
    for (let k = 0; k < P.length; k++) {
      const a = P[k], b = P[(k + 1) % P.length];
      if (a[1] !== b[1]) edges.push([a[0], a[1], b[0], b[1]]);
      minX = Math.min(minX, a[0]); maxX = Math.max(maxX, a[0]);
      minY = Math.min(minY, a[1]); maxY = Math.max(maxY, a[1]);
    }
  }
  const SS = 4;
  const x0 = Math.max(0, Math.floor(minX)), x1 = Math.min(c.w - 1, Math.ceil(maxX));
  const y0 = Math.max(0, Math.floor(minY)), y1 = Math.min(c.h - 1, Math.ceil(maxY));
  const wpx = x1 - x0 + 1;
  const cov = new Float32Array(wpx * (y1 - y0 + 1));

  for (let py = y0; py <= y1; py++) {
    for (let s = 0; s < SS; s++) {
      const y = py + (s + 0.5) / SS;
      const xs = [];
      for (const e of edges) {
        const [ax, ay, bx, by] = e;
        if ((y >= ay && y < by) || (y >= by && y < ay)) {
          xs.push({ x: ax + ((y - ay) / (by - ay)) * (bx - ax), d: by > ay ? 1 : -1 });
        }
      }
      if (xs.length < 2) continue;
      xs.sort((a, b) => a.x - b.x);
      let w = 0;
      for (let k = 0; k < xs.length - 1; k++) {
        w += xs[k].d;
        if (w !== 0) {
          const xa = xs[k].x, xb = xs[k + 1].x;
          for (let px = Math.max(x0, Math.floor(xa)); px <= Math.min(x1, Math.ceil(xb) - 1); px++) {
            const frac = Math.min(px + 1, xb) - Math.max(px, xa);
            if (frac > 0) cov[(py - y0) * wpx + (px - x0)] += frac / SS;
          }
        }
      }
    }
  }
  for (let py = y0; py <= y1; py++)
    for (let px = x0; px <= x1; px++)
      blend(c, px, py, color, Math.min(1, cov[(py - y0) * wpx + (px - x0)]));
}

function drawWallet(c, scaleFrac) { fillGlyph(c, WALLET_PATHS, scaleFrac, FG); }

// ---- PNG encoding ------------------------------------------------------------
const CRC = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
})();
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(td), 0);
  return Buffer.concat([len, td, crc]);
}
function writePNG(c, file) {
  const { w, h, data } = c;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    raw[p++] = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      raw[p++] = Math.round(Math.max(0, Math.min(1, data[i])) * 255);
      raw[p++] = Math.round(Math.max(0, Math.min(1, data[i + 1])) * 255);
      raw[p++] = Math.round(Math.max(0, Math.min(1, data[i + 2])) * 255);
      raw[p++] = Math.round(Math.max(0, Math.min(1, data[i + 3])) * 255);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log("wrote", file, `${w}x${h}`);
}

// ---- compose & export --------------------------------------------------------
const out = path.join(__dirname, "..", "assets");

// icon / adaptive / favicon: FULL-BLEED opaque purple square (no rounded corners —
//   iOS & Android apply their own mask). Wallet has comfortable padding.
// adaptive: wallet kept smaller so it stays inside Android's circular safe zone.
// splash / logo: rounded purple tile on transparent (shown un-masked).
{ const c = makeCanvas(1024, 1024); fillBg(c, BG); drawWallet(c, 0.5);  writePNG(c, path.join(out, "icon.png")); }
{ const c = makeCanvas(1024, 1024); fillBg(c, BG); drawWallet(c, 0.42); writePNG(c, path.join(out, "adaptive-icon.png")); }
{ const c = makeCanvas(96, 96);     fillBg(c, BG); drawWallet(c, 0.56); writePNG(c, path.join(out, "favicon.png")); }
{ const c = makeCanvas(1024, 1024); fillBg(c, [0, 0, 0], 0); roundRect(c, BG, 0, 0, 1024, 1024, 180); drawWallet(c, 0.5); writePNG(c, path.join(out, "splash-icon.png")); }
{ const c = makeCanvas(1024, 1024); fillBg(c, [0, 0, 0], 0); roundRect(c, BG, 0, 0, 1024, 1024, 180); drawWallet(c, 0.5); writePNG(c, path.join(out, "logo.png")); }
console.log("done");
