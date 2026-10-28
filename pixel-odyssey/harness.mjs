import { readFileSync } from 'fs';
const ctx2d = () => new Proxy({}, { get: (t, k) => {
  if (k === 'measureText') return (s) => ({ width: s.length * 8 });
  if (k === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
  return () => {};
}, set: () => true });
const el = () => ({ width: 0, height: 0, getContext: ctx2d, style: {} });
globalThis.document = { createElement: el, getElementById: () => ({ width: 1920, height: 1080, getContext: ctx2d }), fonts: { add() {} } };
globalThis.window = {};
globalThis.ImageData = class { constructor(data, w, h) { this.data = data; this.width = w; this.height = h; } };
globalThis.FontFace = class { load() { return Promise.resolve({}); } };
const lib = await import('./lib/pixel.js');
const EX = ['createPix','stepped','clamp01','smoothf','easeOut','bay','P','SKY','HERO','HERO_WALK','HERO_PAL','DRONE','DRONE_PAL','HEART','ARROW','COIN','COIN_PAL','F','hx','lerp'];
for (const scene of ['Scene01','Scene02','Scene03','Scene04','Scene05']) {
  const src = readFileSync(`scenes/${scene}.html`, 'utf8');
  let code = src.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/import[^\n]+\n/g, '');
  code = code.replace(/const font = new FontFace[^;]*;[\s\S]*?document\.fonts\.add\(f\)\);/, 'const ready = Promise.resolve();');
  const params = EX.map(k => `const ${k} = __imports.${k} ?? undefined;`).join('\n') + '\n';
  const fn = new Function('__imports', params + code + '; return window.film;');
  const film = fn(lib);
  let fail = 0;
  for (let t = 0; t <= film.duration + 0.001; t = +(t + 1 / 12).toFixed(4)) {
    try { film.frame(t); } catch (e) { console.log(scene, 'FAIL', t, e.message); fail++; break; }
  }
  if (!fail) console.log(scene, 'ok', film.duration + 's');
}
