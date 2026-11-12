// Loads the browser scripts that have no page access into one Node VM context,
// the way the page loads them as classic scripts sharing one global scope.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function load(files, extra = {}) {
  const ctx = vm.createContext({ console, Math, JSON, Map, Set, Float32Array, ...extra });
  for (const f of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  // Read a global lexical binding (let/const) or function from the shared scope.
  // Objects are copied out as plain data so they compare equal to test literals.
  ctx.get = expr => {
    const v = vm.runInContext(expr, ctx);
    return v !== null && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v;
  };
  return ctx;
}

// The music core: data, layouts, reeds, chords, hymn tabbing.
function loadTheory(stateOverrides = {}) {
  const ctx = load(['songs.js', 'js/core.js', 'js/theory.js']);
  vm.runInContext(`Object.assign(state, ${JSON.stringify(stateOverrides)}); L = buildLayout();`, ctx);
  return ctx;
}

module.exports = { load, loadTheory, ROOT };
