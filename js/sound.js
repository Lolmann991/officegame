// Kleine Geräusche mit der Web Audio API, ohne Audiodateien.
// Der Browser erlaubt Ton erst nach einer Nutzeraktion; bis dahin bleibt alles stumm.

let ctx = null;
let enabled = true;

export function setSound(on) { enabled = on; }

function audio() {
  if (!enabled) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq, dur, { type = 'square', vol = 0.04, delay = 0, slide = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur, { vol = 0.03, delay = 0, hp = 1500 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = hp;
  src.buffer = buf;
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}

export const sfx = {
  key: () => noise(0.03, { vol: 0.02, hp: 3000 }),
  ok: () => { tone(880, 0.06); tone(1320, 0.08, { delay: 0.06 }); },
  error: () => tone(160, 0.18, { type: 'sawtooth', vol: 0.035 }),
  mail: () => { tone(1046, 0.09, { type: 'sine', vol: 0.05 }); tone(1568, 0.12, { type: 'sine', vol: 0.05, delay: 0.09 }); },
  // Nadeldrucker für die Gehaltsabrechnung
  print: () => { for (let i = 0; i < 9; i++) noise(0.05, { vol: 0.025, delay: i * 0.07, hp: 2200 }); },
  ring: () => { for (let r = 0; r < 2; r++) for (let i = 0; i < 10; i++) tone(i % 2 ? 1100 : 1300, 0.04, { type: 'sine', vol: 0.045, delay: r * 0.8 + i * 0.045 }); },
  achievement: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, { type: 'triangle', vol: 0.05, delay: i * 0.09 })),
  door: () => tone(220, 0.25, { type: 'triangle', vol: 0.03, slide: -60 }),
};
