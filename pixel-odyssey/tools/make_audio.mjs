// tools/make_audio.mjs — deterministic chiptune bed (30s) + SFX, written as WAV files.
// Square lead / triangle bass / noise percussion, one section per scene, all seeded.
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'assets');
const SR = 44100;
const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const freq = (n) => {
  if (typeof n === 'number') return n;
  const m = n.match(/^([A-G]#?)(\d)$/);
  return 440 * Math.pow(2, (NOTE[m[1]] + (parseInt(m[2]) - 4) * 12 - 9) / 12);
};

function makeBuf(dur) {
  const n = Math.ceil(SR * dur);
  return { L: new Float32Array(n), R: new Float32Array(n), n };
}
function tone(b, t0, f, dur, type, gain, pan = 0, fadeOut = 0) {
  const f0 = freq(f), start = Math.round(t0 * SR), end = Math.min(b.n, Math.round((t0 + dur) * SR));
  const gl = gain * (1 - pan * 0.5), gr = gain * (1 + pan * 0.5);
  let ph = 0;
  for (let i = start; i < end; i++) {
    const tt = (i - start) / SR;
    ph += f0 / SR;
    const c = ph % 1;
    let v = type === 'square' ? (c < 0.5 ? 1 : -1) : type === 'tri' ? (4 * Math.abs(c - 0.5) - 1) : Math.sin(2 * Math.PI * c);
    let env = Math.min(1, tt / 0.004) * Math.exp(-tt * (3.2 / Math.max(0.05, dur)));
    if (fadeOut && tt > dur - fadeOut) env *= Math.max(0, (dur - tt) / fadeOut);
    b.L[i] += v * gl * env * 0.5; b.R[i] += v * gr * env * 0.5;
  }
}
function kick(b, t0, gain = 0.5) {
  const start = Math.round(t0 * SR), end = Math.min(b.n, Math.round((t0 + 0.12) * SR));
  let ph = 0;
  for (let i = start; i < end; i++) {
    const tt = (i - start) / SR, f = 100 * Math.pow(0.35, tt / 0.12);
    ph += f / SR;
    b.L[i] += Math.sin(2 * Math.PI * ph) * gain * Math.exp(-tt * 28) * 0.5;
    b.R[i] += b.L[i];
  }
}
let nzState = 12345;
const nzNext = () => { nzState = (nzState * 1103515245 + 12345) & 0x7fffffff; return nzState / 0x7fffffff; };
function hat(b, t0, dur, gain) {
  const start = Math.round(t0 * SR), end = Math.min(b.n, Math.round((t0 + dur) * SR));
  for (let i = start; i < end; i++) {
    const tt = (i - start) / SR, v = (nzNext() * 2 - 1) * Math.exp(-tt * (5 / dur));
    b.L[i] += v * gain * 0.5; b.R[i] += v * gain * 0.5;
  }
}
function crash(b, t0, dur, gain) {
  const start = Math.round(t0 * SR), end = Math.min(b.n, Math.round((t0 + dur) * SR));
  for (let i = start; i < end; i++) {
    const tt = (i - start) / SR, v = (nzNext() * 2 - 1) * Math.exp(-tt * (2.5 / dur));
    b.L[i] += v * gain * 0.5; b.R[i] += v * gain * 0.5;
  }
}
function normalize(b, peak) {
  let m = 0;
  for (let i = 0; i < b.n; i++) m = Math.max(m, Math.abs(b.L[i]), Math.abs(b.R[i]));
  const k = m > 0 ? peak / m : 1;
  for (let i = 0; i < b.n; i++) { b.L[i] *= k; b.R[i] *= k; }
}
function wav(name, b) {
  const nCh = 2, bytes = b.n * nCh * 2, hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + bytes, 4); hdr.write('WAVE', 8);
  hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(nCh, 22);
  hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * nCh * 2, 28); hdr.writeUInt16LE(nCh * 2, 32); hdr.writeUInt16LE(16, 34);
  hdr.write('data', 36); hdr.writeUInt32LE(bytes, 40);
  const d = Buffer.alloc(bytes);
  for (let i = 0; i < b.n; i++) {
    d.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(b.L[i] * 32767))), i * 4);
    d.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(b.R[i] * 32767))), i * 4 + 2);
  }
  writeFileSync(join(OUT, name), Buffer.concat([hdr, d]));
  console.log('wrote', name);
}

// ================= music bed (30s, one section per scene) =================
const m = makeBuf(30);
const arp = (t, dur, chord, gain, type = 'tri') => chord.forEach((n, i) => tone(m, t + i * 0.02, n, dur, type, gain / chord.length));

// S1 0–4.5 屋顶·启程: calm pad + bells
arp(0, 2.2, ['C4', 'E4', 'G4', 'B4'], 0.5);
arp(2.25, 2.2, ['F3', 'A3', 'C4', 'E4'], 0.5);
tone(m, 0.0, 'C3', 2.1, 'tri', 0.16);
tone(m, 2.25, 'F2', 2.1, 'tri', 0.16);
[[0.5, 'E5'], [1.0, 'G5'], [1.5, 'C6'], [2.5, 'A5'], [3.0, 'C6'], [3.5, 'E6']].forEach(([t, n]) => tone(m, t, n, 0.35, 'square', 0.07));

// S2 4.5–10.5 原野·金币: overworld bounce C / Am / F / G, bass eighths, hats, kick
{
  const seg = 1.5, roots = [['C3', 'C4', 'E4', 'G4'], ['A2', 'A3', 'C4', 'E4'], ['F2', 'F3', 'A3', 'C4'], ['G2', 'G3', 'B3', 'D4']];
  for (let bar = 0; bar < 4; bar++) {
    const t0 = 4.5 + bar * seg;
    arp(t0, seg - 0.05, roots[bar].slice(1), 0.4, 'tri');
    for (let e = 0; e < 6; e++) tone(m, t0 + e * 0.25, roots[bar][0], 0.2, 'square', 0.09);
  }
  const lead = ['E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'A5', 'G5', 'E5', 'G5', 'F5', 'A5', 'C6', 'A5', 'G5', 'E5', 'D5', 'C5'];
  lead.forEach((n, i) => tone(m, 4.5 + i * 0.25, n, 0.22, 'square', 0.075));
  for (let b = 0; b < 12; b++) { hat(m, 4.5 + b * 0.5, 0.05, 0.05); kick(m, 4.5 + b * 0.5, 0.4); }
}

// S3 10.5–16.5 夜林·萤火: Am / F, slow tri lead, sparse
arp(10.5, 2.7, ['A3', 'C4', 'E4'], 0.42);
arp(13.25, 3.2, ['F3', 'A3', 'C4', 'E4'], 0.42);
tone(m, 10.5, 'A2', 2.6, 'tri', 0.15);
tone(m, 13.25, 'F2', 3.1, 'tri', 0.15);
[[11.0, 'A4'], [12.0, 'E5'], [12.5, 'E6'], [13.5, 'C5'], [14.5, 'A4'], [15.5, 'B4']].forEach(([t, n]) => tone(m, t, n, 0.5, 'tri', 0.11));
for (let b = 0; b < 12; b++) hat(m, 10.5 + b * 0.5, 0.04, 0.022);

// S4 16.5–23 雪山·登顶: driving Am G F E, eighths, then flag fanfare at 21.5
{
  const seg = 1.375, roots = [['A2', 'A4', 'C5', 'E5'], ['G2', 'G4', 'B4', 'D5'], ['F2', 'F4', 'A4', 'C5'], ['E2', 'E4', 'B4', 'E5']];
  for (let bar = 0; bar < 4; bar++) {
    const t0 = 16.5 + bar * seg;
    for (let e = 0; e < 6; e++) tone(m, t0 + e * 0.229, roots[bar][0], 0.2, 'square', 0.1);
    const ost = roots[bar].slice(1);
    for (let q = 0; q < 6; q++) tone(m, t0 + q * 0.229, ost[q % 3], 0.18, 'square', 0.06);
  }
  for (let i = 0; i < 26; i++) { hat(m, 16.5 + i * 0.25, 0.04, 0.045); if (i % 2 === 0) kick(m, 16.5 + i * 0.5, 0.42); }
}
crash(m, 21.5, 0.35, 0.3);
tone(m, 21.5, 'C5', 0.5, 'square', 0.11); tone(m, 21.5, 'E5', 0.5, 'square', 0.11); tone(m, 21.5, 'G5', 0.5, 'square', 0.11);
tone(m, 21.5, 'C4', 0.6, 'tri', 0.2); kick(m, 21.5, 0.5);

// S5 23–30 黎明·远方核心: F / G / C resolve, warm bells, held ending
arp(23, 1.95, ['F3', 'A3', 'C4'], 0.45);
arp(25, 1.45, ['G3', 'B3', 'D4'], 0.45);
tone(m, 23, 'F2', 1.9, 'tri', 0.15); tone(m, 25, 'G2', 1.4, 'tri', 0.15);
tone(m, 24.5, 'C6', 0.5, 'square', 0.08);
tone(m, 25.0, 'E6', 0.5, 'square', 0.08);
tone(m, 25.5, 'G6', 0.8, 'square', 0.07);
tone(m, 26.5, 'E6', 1.2, 'square', 0.07);
tone(m, 27.7, 'C6', 2.1, 'square', 0.07, 0, 1.0);
arp(26.5, 3.4, ['C4', 'E4', 'G4', 'C5'], 0.5, 'tri');
tone(m, 26.5, 'C3', 3.4, 'tri', 0.16, 0, 1.2);
for (let b = 0; b < 7; b++) hat(m, 23 + b * 0.5, 0.035, 0.02);

normalize(m, 0.8);
wav('music.wav', m);

// ================= SFX =================
function sfx(name, dur, fn) { const b = makeBuf(dur); fn(b); normalize(b, 0.7); wav(name, b); }

sfx('sfx_select.wav', 0.12, (b) => { tone(b, 0, 880, 0.05, 'square', 0.5); tone(b, 0.05, 1320, 0.07, 'square', 0.5); });
sfx('sfx_text.wav', 0.05, (b) => tone(b, 0, 1100, 0.04, 'square', 0.5));
sfx('sfx_coin.wav', 0.22, (b) => { tone(b, 0, 'B5', 0.07, 'square', 0.5); tone(b, 0.07, 'E6', 0.15, 'square', 0.5); });
sfx('sfx_powerup.wav', 0.6, (b) => ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => tone(b, i * 0.09, n, 0.14, 'square', 0.5)));
sfx('sfx_whoosh.wav', 0.55, (b) => {
  const start = 0, n = b.n;
  for (let i = 0; i < n; i++) {
    const tt = i / SR, env = Math.sin(Math.PI * (tt / 0.55));
    const v = (nzNext() * 2 - 1) * env * 0.8;
    b.L[i] += v; b.R[i] += v * 0.8;
  }
});
sfx('sfx_crash.wav', 0.4, (b) => crash(b, 0, 0.4, 1));

console.log('done');
