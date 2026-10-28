// lib/motion.js — time, easing and geometry (from the aicut-motion skill, style-neutral)

export const clamp = (x) => Math.min(1, Math.max(0, x));
export const mix = (a, b, p) => a + (b - a) * p;

export const EASE = {
  out: (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  in: (p) => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, 10 * p - 10)),
  inOut: (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5
    ? Math.pow(2, 20 * p - 10) / 2
    : (2 - Math.pow(2, -20 * p + 10)) / 2),
  smooth: (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p)),
  snap: (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.pow(1 - p, 4)),
  linear: (p) => clamp(p),
};

export const prog = (t, start, dur, ease = EASE.smooth) => ease(clamp((t - start) / dur));

export const stepped = (t, perSecond) => Math.floor(t * perSecond) / perSecond;
