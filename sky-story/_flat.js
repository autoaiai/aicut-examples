/* _flat.js — 扁平矢量科普共用：缓动、确定性随机、画布、几何。全部是 t 的纯函数。 */
(() => {
  const clamp = (x) => Math.min(1, Math.max(0, x));
  const mix = (a, b, p) => a + (b - a) * p;
  const easeOut = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  const easeIn = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, 10 * p - 10));
  const easeInOut = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5
    ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2);
  const smooth = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p));
  const snap = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.pow(1 - p, 4));
  const linear = (p) => clamp(p);
  /* 从 start 起、历时 dur 秒，缓动到 1 */
  const prog = (t, start, dur, ease = easeOut) => ease(clamp((t - start) / dur));

  const hash = (seed) => {
    let h = 2166136261;
    for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 100000) / 100000;
  };

  const C = {};
  const readColors = () => {
    const s = getComputedStyle(document.documentElement);
    for (const k of ['paper', 'ink', 'ink2', 'ink3', 'blue', 'sky', 'band', 'red', 'amber', 'green', 'violet'])
      C[k] = s.getPropertyValue('--' + k).trim();
  };

  const canvas = () => {
    readColors();
    const c = document.getElementById('c');
    const g = c.getContext('2d');
    let dpr = 1, W = 1920, H = 1080;
    const fit = () => {
      dpr = window.devicePixelRatio || 1;
      W = window.innerWidth || 1920;
      H = window.innerHeight || 1080;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    };
    fit();
    addEventListener('resize', fit);
    return {
      g,
      get W() { return W; },
      get H() { return H; },
      begin() { g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.lineJoin = 'round'; },
    };
  };

  const rr = (g, x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };

  /* 一段折线画到 p 的比例处 */
  const polyProg = (pts, p) => {
    const segs = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      segs.push(d); total += d;
    }
    let want = clamp(p) * total;
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (want >= segs[i - 1]) { out.push(pts[i]); want -= segs[i - 1]; }
      else {
        const q = segs[i - 1] ? want / segs[i - 1] : 0;
        out.push([mix(pts[i - 1][0], pts[i][0], q), mix(pts[i - 1][1], pts[i][1], q)]);
        break;
      }
    }
    return out;
  };

  /* 带实心三角箭头的线 */
  const arrow = (g, x1, y1, x2, y2, w = 3, head = 14) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const bx = x2 - Math.cos(a) * head, by = y2 - Math.sin(a) * head;
    g.lineWidth = w;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(bx, by); g.stroke();
    g.beginPath();
    g.moveTo(x2, y2);
    g.lineTo(bx + Math.cos(a + Math.PI / 2) * head * 0.42, by + Math.sin(a + Math.PI / 2) * head * 0.42);
    g.lineTo(bx + Math.cos(a - Math.PI / 2) * head * 0.42, by + Math.sin(a - Math.PI / 2) * head * 0.42);
    g.closePath();
    g.fill();
  };

  /* 白光的“实体感”：先描一道略宽的 ink 边，再用白色盖上，两侧各留约 1.6 px 边
     （扁平风格里白光唯一可读的画法，任意方向都成立） */
  const litLine = (g, x1, y1, x2, y2, h, fill) => {
    g.lineCap = 'butt';
    g.strokeStyle = 'rgba(23,32,46,0.45)';
    g.lineWidth = h + 3.2;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = fill;
    g.lineWidth = h;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  };

  const mono = (g, size, color, align = 'left') => {
    g.font = `400 ${size}px "IBM Plex Mono", Consolas, monospace`;
    g.fillStyle = color;
    g.textAlign = align;
    g.textBaseline = 'middle';
  };

  window.FLAT = { clamp, mix, prog, easeOut, easeIn, easeInOut, smooth, snap, linear, hash, canvas, rr, polyProg, arrow, litLine, mono, C };
})();
