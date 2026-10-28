// lib/pixel.js — shared 16-bit pixel engine for "像素奇旅" (style #22: 16-Bit Pixel Odyssey)
// 320x180 internal buffer, nearest-neighbour scaled to 1920x1080 (x6). Strict palette, banded
// skies with checker dither, whole-pixel motion on a 12 fps game tick.

export const LW = 320, LH = 180;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

export const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const mixc = (a, b, k) => [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k), Math.round(a[2] + (b[2] - a[2]) * k)];
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothf = (a, b, f) => { const t = clamp01((f - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeOut = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
export const lerp = (a, b, k) => a + (b - a) * k;
export const stepped = (t, ps) => Math.floor(t * ps) / ps;

export function rng(seed) {
  let s = (seed * 2654435761) >>> 0;
  const n = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { next: n, int: (a, b) => a + Math.floor(n() * (b - a + 1)), chance: (p) => n() < p, pick: (a) => a[Math.floor(n() * a.length)] };
}

function makeNoise(seed) {
  const r = rng(seed);
  const g = new Float32Array(512);
  for (let i = 0; i < 512; i++) g[i] = r.next() * 2 - 1;
  const h = (a, b) => g[(((a * 73 + b * 149) % 512) + 512) % 512];
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return h(xi, yi) * (1 - sx) * (1 - sy) + h(xi + 1, yi) * sx * (1 - sy) + h(xi, yi + 1) * (1 - sx) * sy + h(xi + 1, yi + 1) * sx * sy;
  };
  const fbm2 = (x, y, o) => { let v = 0, a = 0.6, f = 1; for (let i = 0; i < o; i++) { v += a * n2(x * f, y + i * 17.3); a *= 0.5; f *= 2; } return v; };
  return { n2, fbm2 };
}
export { makeNoise };

// ---------------- master palette (strict, ~40 colours) ----------------
export const P = {
  ink: hx('#0a0618'), white: hx('#f8f8ff'), grey: hx('#9aa0c8'),
  gold: hx('#ffd27a'), goldHi: hx('#fff4d8'), red: hx('#ff3a4a'), green: hx('#6aff8a'),
  cyan: hx('#6ef0ff'), core: hx('#c8fcff'), coreMid: hx('#4ad8ff'), coreDeep: hx('#1a78c8'),
  pink: hx('#ff5a8a'), pinkD: hx('#b02a6a'), skin: hx('#ffc8a0'), blue: hx('#3a6ad8'), blueD: hx('#22408a'),
  star: hx('#fff4d8'), starDim: hx('#a88ac8'),
  winY: hx('#ffd27a'), winC: hx('#6ef0ff'), winP: hx('#ff6ab0'), redBeacon: hx('#ff3a4a'),
};
export const SKY = {
  dusk: ['#140c34', '#1e1146', '#2c1658', '#43206a', '#632a78', '#8c357c', '#b8457a', '#e05c72', '#f6806a', '#ffaa6e', '#ffd28a'].map(hx),
  morning: ['#173a6e', '#24528e', '#36689f', '#5288b4', '#74a8c8', '#9cc4dc', '#c8e0ec', '#ffe0b0'].map(hx),
  night: ['#04041a', '#070a26', '#0b1134', '#112048', '#182c58', '#22386a'].map(hx),
  snow: ['#204070', '#2c5288', '#3f6ba4', '#5d8bbc', '#8ab4d8', '#c0dcf0'].map(hx),
  dawnWarm: ['#2a1850', '#5c2a74', '#9c4478', '#d86a72', '#f89a6e', '#ffd28a'].map(hx),
};

// ---------------- sprites ----------------
export const HERO = [
  '.....KKKK......',
  '....KHHHHK.....',
  '...KHHhHHHK....',
  '...KHHHHSSHK...',
  '...KHHHSSKSK...',
  '...KHhSSSSSK...',
  '....KHSSSSK....',
  '.....KKSSKK....',
  '....KJJJJJJK...',
  '...KJJjJJJJK...',
  '..KJJjJJJJJSK..',
  '..KJJjJJJJKSK..',
  '..KJjjJJJJKKK..',
  '...KJJJJJJK....',
  '...KcccccccK...',
  '...KPPPKPPPK...',
  '...KPPpKPPPK...',
  '...KPPpKKPPK...',
  '...KPPK.KPPK...',
  '..KBBBK.KBBBK..',
  '..KBBBBKKBBBBK.',
  '...KKKK..KKKK..',
];
export const HERO_WALK = HERO.slice(0, 18).concat([
  '..KPPK..KPPK...', '.KBBBK...KBBK..', '.KBBBBK..KBBBBK', '..KKKK....KKKK.',
]);
export const HERO_PAL = { K: '#0a0618', H: '#ff5a8a', h: '#b02a6a', S: '#ffc8a0', J: '#3a6ad8', j: '#22408a', c: '#ffd27a', P: '#3a2a5a', p: '#22183a', B: '#b8456a' };

export const DRONE = [
  '...KKKKK...',
  '..KWWWWWK..',
  '.KWwwwwwWK.',
  'KWwKKKKKwWK',
  'KWKEEeEEKWK',
  'KWKEeeeEKWK',
  'KwwKKKKKwwK',
  '.KwwwwwwwK.',
  '..KKKKKKK..',
  '...K...K...',
];
export const DRONE_PAL = { K: '#0a0618', W: '#e8eef8', w: '#9aa8c8', E: '#4ad8ff', e: '#c8fcff' };

export const HEART = ['.KK.KK.', 'KRRKRRK', 'KRWRRRK', 'KRRRRRK', '.KRRRK.', '..KRK..', '...K...'];
export const ARROW = ['KKKKKKK', 'KWWWWWK', '.KWWWK.', '..KWK..', '...K...'];
export const COIN = ['.KKK.', 'KGGGK', 'KGgGK', 'KGGGK', '.KKK.'];
export const COIN_PAL = { K: '#0a0618', G: '#ffd27a', g: '#fff4d8' };

// font stacks
export const F = {
  px: (n) => n + 'px "Press Start 2P"',
  cjk: (n, bold) => (bold ? 'bold ' : '') + n + 'px "Microsoft YaHei","Noto Sans SC",sans-serif',
};

// ---------------- engine factory ----------------
export function createPix() {
  const buf = new Uint8ClampedArray(LW * LH * 4);
  let OY = 0;
  const put = (x, y, c) => {
    x |= 0; y = (y + OY) | 0;
    if (x < 0 || y < 0 || x >= LW || y >= LH) return;
    const i = (y * LW + x) * 4;
    buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255;
  };
  const get = (x, y) => { y = (y + OY) | 0; if (x < 0 || y < 0 || x >= LW || y >= LH) return [0, 0, 0]; const i = (y * LW + x) * 4; return [buf[i], buf[i + 1], buf[i + 2]]; };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
  const dput = (x, y, c1, c2, a) => put(x, y, a > bay(x, y) ? c2 : c1);

  const sprite = (rows, pal, ox, oy, flip, scale = 1) => {
    const cp = {}; for (const k in pal) cp[k] = typeof pal[k] === 'string' ? hx(pal[k]) : pal[k];
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      const xx = flip ? row.length - 1 - i : i;
      for (let a = 0; a < scale; a++) for (let b = 0; b < scale; b++) put(ox + xx * scale + a, oy + j * scale + b, cp[ch]);
    }));
  };

  // ---- text rasteriser (threshold to pure buffer pixels) ----
  let tcv = null, tctx = null;
  const text = (str, x, y, col, shadow, font, outline = null) => {
    if (!tcv) { tcv = document.createElement('canvas'); tcv.width = LW; tcv.height = 48; tctx = tcv.getContext('2d', { willReadFrequently: true }); }
    tctx.clearRect(0, 0, LW, 48);
    tctx.font = font; tctx.textBaseline = 'top'; tctx.fillStyle = '#fff';
    tctx.fillText(str, 0, 4);
    const w = Math.min(LW, Math.ceil(tctx.measureText(str).width) + 2), h = 48, d = tctx.getImageData(0, 0, w, h).data;
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        if (d[(j * w + i) * 4 + 3] > 110) {
          if (pass === 0) {
            if (outline) for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) put(x + i + ox, y + j + oy, outline);
            if (shadow) put(x + i + 1, y + j + 1, shadow);
          } else put(x + i, y + j, col);
        }
      }
      if (!outline && pass === 0 && !shadow) pass = 1;
    }
    return w;
  };

  // ---- SNES RPG window ----
  const WB = ['#4060d0', '#3450bc', '#2a42a6', '#22358e', '#1a2a78', '#142064'].map(hx);
  const win = (x0, y0, w, h) => {
    for (let y = y0; y < y0 + h; y++) {
      const f = ((y - y0) / h) * (WB.length - 1), i = Math.min(WB.length - 2, Math.floor(f)), a = smoothf(0.7, 1, f - i);
      for (let x = x0; x < x0 + w; x++) {
        if ((x === x0 || x === x0 + w - 1) && (y === y0 || y === y0 + h - 1)) continue;
        dput(x, y, WB[i], WB[i + 1], a);
      }
    }
    for (let x = x0 + 1; x < x0 + w - 1; x++) { put(x, y0, P.white); put(x, y0 + h - 1, P.white); put(x, y0 + 1, P.grey); put(x, y0 + h - 2, P.grey); put(x, y0 - 1, P.ink); put(x, y0 + h, P.ink); }
    for (let y = y0 + 1; y < y0 + h - 1; y++) { put(x0, y, P.white); put(x0 + w - 1, y, P.white); put(x0 + 1, y, P.grey); put(x0 + w - 2, y, P.grey); put(x0 - 1, y, P.ink); put(x0 + w, y, P.ink); }
  };

  // ---- environment kit ----
  const skyBands = (bands, hz) => {
    for (let y = 0; y < LH; y++) {
      const f = Math.pow(clamp01(y / hz), 1.2) * (bands.length - 1);
      const i = Math.min(bands.length - 2, Math.floor(f)), a = smoothf(0.55, 1, f - i);
      for (let x = 0; x < LW; x++) dput(x, y, bands[i], bands[i + 1], a);
    }
  };
  const skyBands2 = (bandsA, bandsB, k, hz) => {
    for (let y = 0; y < LH; y++) {
      const f = Math.pow(clamp01(y / hz), 1.2) * (bandsA.length - 1);
      const i = Math.min(bandsA.length - 2, Math.floor(f)), a = smoothf(0.55, 1, f - i);
      const cA = mixc(bandsA[i], bandsB[i], k), cB = mixc(bandsA[i + 1], bandsB[i + 1], k);
      for (let x = 0; x < LW; x++) dput(x, y, cA, cB, a);
    }
  };
  const stars = (n, seed, T, maxY = 46) => {
    const r = rng(seed);
    for (let s = 0; s < n; s++) {
      const x = r.int(0, LW - 1), y = r.int(0, maxY), ph = r.next() * 6.28;
      if (Math.sin(T * 3 + ph) > -0.3) put(x, y, y < maxY / 2 ? P.star : P.starDim);
    }
  };
  const sunStriped = (sx, sy, sr) => {
    for (let y = sy - sr; y <= sy + sr; y++) {
      const ry = (y - (sy - sr)) / (2 * sr);
      if (y > sy - 4) { const k = y - (sy - 4), gap = 1 + Math.floor(k / 9); if ((k % 7) < gap) continue; }
      for (let x = sx - sr; x <= sx + sr; x++) {
        if ((x - sx) ** 2 + (y - sy) ** 2 > sr * sr) continue;
        put(x, y, ry < 0.45 ? (ry < 0.3 ? P.goldHi : (0.3 + 0.15 * bay(x, y) > ry ? P.goldHi : P.gold)) : (ry < 0.55 ? P.gold : (ry - 0.55) * 3 > bay(x, y) ? hx('#ff9a5c') : P.gold));
      }
    }
  };
  const cloud = (cx, cy, w, h, cDark, cLit, cHot) => {
    cDark = cDark || hx('#7a3478'); cLit = cLit || hx('#e8687a'); cHot = cHot || hx('#ffb08a');
    for (let y = cy - h; y <= cy + h; y++) for (let x = Math.round(cx - w); x <= cx + w; x++) {
      const dx = (x - cx) / w, dy = (y - cy) / h, lump = 1 + 0.25 * Math.sin(x * 0.35 + cx);
      if (dx * dx + (dy * dy) / lump > 1) continue;
      put(x, y, dy > 0.55 ? cHot : dy > 0.15 ? cLit : cDark);
    }
  };
  const nz = makeNoise(77);
  const mountains = (base, amp, freq, seed, scroll, col, lit, sunX = -999, yMax = LH) => {
    const hgt = [];
    for (let x = -1; x <= LW + 1; x++) {
      const u = (x + scroll) * freq;
      hgt.push(Math.round(base - amp * (Math.abs(nz.fbm2(u, seed, 3)) * 1.6 + 0.35 * nz.n2(u * 3.1, seed + 9))));
    }
    for (let x = 0; x < LW; x++) {
      const top = hgt[x + 1], facing = hgt[x + 2] < hgt[x + 1] ? 0 : 1;
      for (let y = Math.max(0, top); y < yMax; y++) {
        const d = y - top;
        if (d < 2 && (facing || Math.abs(x - sunX) < 40)) put(x, y, lit);
        else if (d < 5 && facing) dput(x, y, col, lit, 0.5 - d * 0.1);
        else put(x, y, col);
      }
    }
  };
  const skyline = (seed, base, minH, maxH, col, lit, winCols, scroll, winOn = 0.3, T = 0) => {
    const r = rng(seed); let bx = -24 - Math.round(scroll);
    while (bx < LW) {
      const w = r.int(9, 18), h = r.int(minH, maxH), top = base - h, rr = rng(seed * 31 + w * 7 + h);
      rect(bx, top, w, h, col); rect(bx, top, w, 1, lit); for (let y = top; y < base; y++) put(bx + w - 1, y, lit);
      if (rr.chance(0.35)) {
        const ah = rr.int(2, 6); for (let k = 1; k <= ah; k++) put(bx + (w >> 1), top - k, col);
        if (Math.sin(T * 4 + w) > 0) put(bx + (w >> 1), top - ah - 1, P.redBeacon);
      }
      const wc = rr.pick(winCols);
      for (let wy = top + 2; wy < base - 1; wy += 2) for (let wx = bx + 1; wx < bx + w - 2; wx += 2) if (rr.next() < winOn) put(wx, wy, wc);
      bx += w + r.int(0, 3);
    }
  };
  const moon = (sx, sy, sr) => {
    for (let y = sy - sr; y <= sy + sr; y++) for (let x = sx - sr; x <= sx + sr; x++) {
      const d = (x - sx) ** 2 + (y - sy) ** 2;
      if (d > sr * sr) continue;
      put(x, y, d < (sr - 3) * (sr - 3) * 0.25 ? hx('#d8d0b8') : hx('#f8f0d0'));
    }
  };
  const pine = (x, baseY, h, col, lit) => {
    const tiers = 3;
    for (let tI = 0; tI < tiers; tI++) {
      const ty = baseY - Math.round((h * 0.72) * (tI / tiers)), tw = Math.round((h * 0.5) * (1 - tI / tiers * 0.6));
      for (let j = 0; j < Math.round(h * 0.3); j++) {
        const ww = Math.round(tw * (1 - j / (h * 0.3)));
        for (let i = -ww; i <= ww; i++) put(x + i, ty + j, i === ww ? lit : col);
      }
    }
    rect(x, baseY, 2, Math.round(h * 0.18), col);
  };

  // ---- SNES transitions ----
  const mosaic = (n) => {
    if (n <= 1) return;
    for (let by = 0; by < LH; by += n) for (let bx = 0; bx < LW; bx += n) {
      const sx = Math.min(LW - 1, bx + (n >> 1)), sy = Math.min(LH - 1, by + (n >> 1)), si = (sy * LW + sx) * 4;
      for (let y = by; y < Math.min(LH, by + n); y++) for (let x = bx; x < Math.min(LW, bx + n); x++) {
        const i = (y * LW + x) * 4;
        buf[i] = buf[si]; buf[i + 1] = buf[si + 1]; buf[i + 2] = buf[si + 2];
      }
    }
  };
  const swirl = (k, p) => {
    if (k <= 0) return;
    const src = buf.slice();
    const WHITE = hx('#f8f4ff');
    for (let y = 0; y < LH; y++) {
      const off = Math.round(Math.sin(y * 0.25 + p * 20) * k * 40);
      for (let x = 0; x < LW; x++) {
        const sx = ((x + off) % LW + LW) % LW, si = (y * LW + sx) * 4, i = (y * LW + x) * 4;
        for (let c = 0; c < 3; c++) buf[i + c] = src[si + c] + (WHITE[c] - src[si + c]) * k * 0.6;
      }
    }
  };
  const whiteout = (k) => {
    if (k <= 0) return;
    const W = hx('#f0f6ff');
    for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) if (k > bay(x, y)) put(x, y, W);
  };
  const iris = (cx, cy, R) => {
    for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 > R * R) { const i = (y * LW + x) * 4; buf[i] = buf[i + 1] = buf[i + 2] = 0; }
  };
  const flash = (amt) => {
    for (let i = 0; i < buf.length; i += 4) {
      buf[i] = Math.min(255, buf[i] + amt); buf[i + 1] = Math.min(255, buf[i + 1] + amt * 0.5); buf[i + 2] = Math.min(255, buf[i + 2] + amt * 0.5);
    }
  };
  const fade = (lvl) => { // 16-step master brightness, lvl 0..15
    if (lvl >= 15) return;
    for (let i = 0; i < buf.length; i += 4) { buf[i] = buf[i] * lvl / 15; buf[i + 1] = buf[i + 1] * lvl / 15; buf[i + 2] = buf[i + 2] * lvl / 15; }
  };

  // ---- blit: x6 nearest neighbour onto the stage canvas ----
  const lc = document.createElement('canvas'); lc.width = LW; lc.height = LH;
  const lx = lc.getContext('2d');
  const blit = (ctx, W, H) => {
    lx.putImageData(new ImageData(buf, LW, LH), 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(lc, 0, 0, W, H);
    ctx.restore();
  };

  return { buf, put, get, rect, dput, sprite, text, win, skyBands, skyBands2, stars, sunStriped, cloud, mountains, skyline, moon, pine, mosaic, swirl, whiteout, iris, flash, fade, blit, setOY: (v) => { OY = v; } };
}
