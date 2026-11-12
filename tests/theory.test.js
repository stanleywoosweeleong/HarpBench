const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTheory } = require('./load');

const midi = name => {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  const pc = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 12 * (Number(m[3]) + 1) + pc;
};

test('C diatonic uses Richter tuning from C4', () => {
  const t = loadTheory({ type: 'diatonic', key: 0 });
  const holes = t.get('L.holes');
  assert.deepEqual(holes.map(h => h.blow), ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'].map(midi));
  assert.deepEqual(holes.map(h => h.draw), ['D4', 'G4', 'B4', 'D5', 'F5', 'A5', 'B5', 'D6', 'F6', 'A6'].map(midi));
});

test('bend depths match a real diatonic', () => {
  const t = loadTheory({ type: 'diatonic', key: 0 });
  const holes = t.get('L.holes');
  assert.deepEqual(holes.map(h => h.drawBend), [1, 2, 3, 1, 0, 1, 0, 0, 0, 0]);
  assert.deepEqual(holes.map(h => h.blowBend), [0, 0, 0, 0, 0, 0, 0, 1, 1, 2]);
});

test('low keys sit below C, high keys above', () => {
  assert.equal(loadTheory({ type: 'diatonic', key: 7 }).get('L.base'), midi('G3'));
  assert.equal(loadTheory({ type: 'diatonic', key: 9 }).get('L.base'), midi('A3'));
  assert.equal(loadTheory({ type: 'diatonic', key: 5 }).get('L.base'), midi('F4'));
});

test('tab notation for bends and overblows', () => {
  const t = loadTheory({ type: 'diatonic', key: 0, overblows: true });
  assert.equal(t.get(`resolve(2,'draw',2,false).tab`), "-3''");
  assert.equal(t.get(`resolve(2,'draw',2,false).midi`), midi('A4'));
  assert.equal(t.get(`resolve(5,'blow',0,true).tab`), '6o');
  assert.equal(t.get(`resolve(5,'blow',0,true).midi`), midi('Bb5'));
});

test('chromatic slide raises a semitone', () => {
  const t = loadTheory({ type: 'chromatic', key: 0 });
  assert.equal(t.get('L.N'), 12);
  assert.equal(t.get(`resolve(0,'blow',0,true).tab`), '1<');
  assert.equal(t.get(`resolve(0,'blow',0,true).midi`), midi('C#4'));
});

test('C major is a blow chord and G7 a draw chord on a C harp', () => {
  const t = loadTheory({ type: 'diatonic', key: 0 });
  const c = t.get(`voiceChord(0,[0,4,7])`);
  assert.equal(c.kind, 'block');
  assert.ok(c.specs.every(s => s.breath === 'blow'));
  const g7 = t.get(`voiceChord(7,[0,4,7,10])`);
  assert.equal(g7.kind, 'block');
  assert.equal(g7.specs.map(s => s.tab).join(' '), '-2 -3 -4 -5');
});

test('every hymn maps fully onto a C harp in its best position', () => {
  const t = loadTheory({ type: 'diatonic', key: 0 });
  for (const s of t.get('SONGS')) {
    const best = t.get(`bestPosition(SONGS.find(x=>x.id===${JSON.stringify(s.id)}))`);
    assert.equal(best.h.miss, 0, `${s.title} has notes the harp cannot play`);
  }
});

test('Amazing Grace in 1st position on a C harp needs no bends', () => {
  const t = loadTheory({ type: 'diatonic', key: 0, rootOff: 0 });
  const m = t.get(`mapSong(SONGS.find(x=>x.id==='amazing'),0)`);
  assert.equal(m.specs.filter(Boolean).slice(0, 8).map(s => s.tab).join(' '), '6 7 8 7 8 -8 7 -6');
  assert.equal(t.get(`songHardness(SONGS.find(x=>x.id==='amazing'),mapSong(SONGS.find(x=>x.id==='amazing'),0)).hard`), 0);
});

test('Blessed Assurance needs an overblow in 1st position', () => {
  const t = loadTheory({ type: 'diatonic', key: 0 });
  assert.equal(t.get(`needsOverblows(SONGS.find(x=>x.id==='assurance'),0)`), true);
  assert.equal(t.get(`needsOverblows(SONGS.find(x=>x.id==='amazing'),0)`), false);
});

test('recorded-note loops hold a whole number of pitch periods', () => {
  const t = loadTheory({});
  for (const f0 of [196, 261.63, 440, 1046.5]) {
    const { start, end } = t.get(`samplerLoop(76800,48000,${f0})`);
    const periods = (end - start) / (48000 / f0);
    assert.ok(Math.abs(periods - Math.round(periods)) < 0.02, `${f0} Hz: ${periods} periods`);
    assert.ok(start > 0 && end < 76800);
  }
});

test('playback picks the nearest recorded note within range', () => {
  const t = loadTheory({});
  assert.equal(t.get('nearestSample([60,64,67],66,4)'), 67);
  assert.equal(t.get('nearestSample([60,64,67],62,4)'), 60);
  assert.equal(t.get('nearestSample([60],70,4)'), null);
});
