const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');

const t = load(['js/core.js', 'js/i18n.js']);
const tr = (s, l) => t.get(`tr(${JSON.stringify(s)},${JSON.stringify(l)})`);

test('plain strings in all three languages', () => {
  assert.equal(tr('Play along', 'en'), 'Play along');
  assert.equal(tr('Play along', 'zh'), '跟奏');
  assert.equal(tr('Play along', 'ms'), 'Main bersama');
});

test('surrounding spaces are kept and unknown text falls back to English', () => {
  assert.equal(tr(' change harp key', 'zh'), ' 切换口琴调');
  assert.equal(tr('Some brand-new sentence', 'zh'), 'Some brand-new sentence');
});

test('patterns translate text with numbers and names in it', () => {
  assert.equal(tr('G · 2nd position (cross harp)', 'zh'), 'G · 第2把位（交叉把位）');
  assert.equal(tr('G · 2nd position (cross harp)', 'ms'), 'G · posisi ke-2 (harmonika silang)');
  assert.equal(tr('Easy · 12th position', 'zh'), '简单 · 第12把位');
  assert.equal(tr('Best 87% · played 3×', 'ms'), 'Terbaik 87% · dimainkan 3×');
  assert.equal(tr('Bend: draw hole 3 and bend it down a whole step. Drag down from the draw note, or hold X and press E.', 'zh'),
    '压音：吸 3 孔并往下压全音。从吸音往下拖，或按住 X 再按 E。');
});

test('hymn titles show the Chinese name beside the English; lyrics are not in the dictionary', () => {
  assert.equal(tr('Amazing Grace', 'zh'), '奇异恩典 · Amazing Grace');
  assert.equal(tr('Amazing Grace', 'ms'), 'Amazing Grace');
  assert.equal(tr('grace!', 'zh'), 'grace!');
});

test('no translation is missing for either language', () => {
  for (const [en, row] of Object.entries(t.get('T'))) {
    assert.equal(row.length, 2, en);
    assert.ok(row[0] && row[1], `missing translation for "${en}"`);
  }
});
