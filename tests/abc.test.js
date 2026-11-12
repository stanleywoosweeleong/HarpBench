const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, ROOT } = require('./load');

const t = load(['songs.js', 'js/abc.js']);
const SONGS = t.get('SONGS');
const FILES = fs.readdirSync(path.join(ROOT, 'tools/openhymnal'));
const PREFIX = { amazing: 'Amazing_Grace', holy: 'Holy_Holy_Holy', jesusloves: 'Jesus_Loves_Me', rock: 'Rock_of_Ages', silent: 'Silent_Night', assurance: 'Blessed_Assurance' };

// The JavaScript importer must agree with the Python builder that produced songs.js.
for (const [id, prefix] of Object.entries(PREFIX)) {
  test(`importing ${prefix} matches the bundled songbook`, () => {
    const file = FILES.find(f => f.startsWith(prefix));
    const abc = fs.readFileSync(path.join(ROOT, 'tools/openhymnal', file), 'latin1');
    const t2 = load(['js/abc.js']);
    t2.abc = abc;
    const got = t2.get('abcToSong(abc,"x")');
    const want = SONGS.find(s => s.id === id);
    assert.deepEqual(got.notes, want.notes);
    assert.deepEqual(got.verses, want.verses);
    assert.deepEqual(got.parts, want.parts);
    assert.equal(got.meter, want.meter);
  });
}

test('a small hand-written tune with a triplet, a broken rhythm and a tie', () => {
  const t2 = load(['js/abc.js']);
  t2.abc = 'X:1\nT:Test Tune\nM:4/4\nL:1/4\nK:G\nG A B c | (3def g2- | g>f e d | G4 |]\nw: one two three four five six seven eight_ nine ten eleven twelve thir- teen\n';
  const s = t2.get('abcToSong(abc,"t")');
  assert.equal(s.title, 'Test Tune');
  assert.ok(Math.abs(s.notes.reduce((a, n) => a + n[1], 0) - 16) < 0.001, 'four bars of 4/4');
  // F is sharp in G major; the tonic is G, so F# is 11 semitones above the G below it
  const fsharp = s.notes.find(n => n[0] % 12 === 11 || n[0] % 12 === -1);
  assert.ok(fsharp, 'F# from the key signature');
  assert.equal(s.notes[0][2], 'one');
});

test('text that is not ABC gives a clear error', () => {
  const t2 = load(['js/abc.js']);
  t2.abc = 'Amazing grace, how sweet the sound';
  assert.throws(() => t2.get('abcToSong(abc)'), /No tune found/);
});
