const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTheory } = require('./load');

const t = loadTheory({ type: 'diatonic', key: 0 });
const song = id => `SONGS.find(x=>x.id===${JSON.stringify(id)})`;

test('meters: simple and compound', () => {
  assert.deepEqual(t.get(`meterInfo('3/4')`), { beat: 1, perBar: 3, barLen: 3 });
  assert.deepEqual(t.get(`meterInfo('9/8')`), { beat: 1.5, perBar: 3, barLen: 4.5 });
  assert.deepEqual(t.get(`meterInfo('3/2')`), { beat: 2, perBar: 3, barLen: 6 });
});

test('Amazing Grace starts with a one-beat pickup in 3/4', () => {
  const g = t.get(`songGrid(${song('amazing')})`);
  assert.equal(g.pickup, 1);
  assert.equal(g.barLen, 3);
  assert.equal(g.total, 48);
});

test('count-in is one full bar, then the pickup falls on beat 3', () => {
  const g = `songGrid(${song('amazing')})`;
  assert.equal(t.get(`countInStart(${g},0)`), -5);
  const beats = t.get(`beatsBetween(${g},-5,1)`);
  assert.deepEqual(beats.map(b => b.t), [-5, -4, -3, -2, -1, 0]);
  assert.deepEqual(beats.map(b => b.beatInBar + 1), [1, 2, 3, 1, 2, 3]);
});

test('every hymn: melody and harmony parts have the same length', () => {
  for (const s of t.get('SONGS')) {
    const total = s.notes.reduce((a, n) => a + n[1], 0);
    for (const p of s.parts) assert.equal(p.reduce((a, n) => a + n[1], 0), total, s.id);
    assert.ok(s.verses.length >= 1, `${s.id} has lyrics`);
    for (const v of s.verses) assert.equal(v.length, s.notes.length, `${s.id} verse alignment`);
  }
});

test('lines cover every note exactly once', () => {
  for (const s of t.get('SONGS')) {
    const r = t.get(`lineRanges(${song(s.id)})`);
    assert.equal(r[0][0], 0);
    assert.equal(r[r.length - 1][1], s.notes.length - 1);
    for (let i = 1; i < r.length; i++) assert.equal(r[i][0], r[i - 1][1] + 1);
  }
});
