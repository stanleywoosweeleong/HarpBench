const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');

const t = load(['js/pitch.js']);
const SR = 48000;

// A harmonica-like tone: strong low harmonics, a little breath noise, deterministic.
function tone(freq, { n = 2048, noise = 0.03, amp = 0.3 } = {}) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let x = 0;
    for (let h = 1; h <= 12; h++) x += Math.pow(h, -0.9) * Math.sin(2 * Math.PI * freq * h * i / SR + h);
    buf[i] = amp * x / 3 + noise * rnd();
  }
  return buf;
}
const cents = (a, b) => 1200 * Math.log2(a / b);

for (const [name, f] of [['G3 (low G harp, hole 1)', 196], ['C4', 261.63], ['A4 (3-draw bend)', 440], ['C6', 1046.5], ['A6 (10 draw)', 1760], ['C7 (10 blow)', 2093]]) {
  test(`finds ${name} within 5 cents`, () => {
    const r = t.detectPitch(tone(f), SR);
    assert.ok(r.freq > 0, 'no pitch found');
    assert.ok(Math.abs(cents(r.freq, f)) < 5, `got ${r.freq.toFixed(2)} Hz for ${f} Hz`);
    assert.ok(r.clarity > 0.8);
  });
}

test('a bent note 30 cents flat reads as 30 cents flat', () => {
  const f = 440 * Math.pow(2, -30 / 1200);
  const r = t.detectPitch(tone(f), SR);
  assert.ok(Math.abs(cents(r.freq, 440) + 30) < 4, `${cents(r.freq, 440).toFixed(1)} cents`);
});

test('silence and noise give no pitch', () => {
  assert.equal(t.detectPitch(new Float32Array(2048), SR).freq, 0);
  let seed = 3;
  const noise = new Float32Array(2048).map(() => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.4);
  assert.equal(t.detectPitch(noise, SR).freq, 0);
});

test('frequency to MIDI note', () => {
  assert.equal(t.freqToMidi(440), 69);
  assert.ok(Math.abs(t.freqToMidi(261.6256) - 60) < 1e-3);
});
