const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');

const t = load(['js/core.js', 'js/theory.js'], { Int16Array, Uint8Array, DataView });

test('WAV header describes 16-bit stereo PCM at the given rate', () => {
  const info = t.get(`(()=>{const b=encodeWav([new Int16Array([1,-1,32767,-32768])],48000,2);const v=new DataView(b.buffer);
    const s=(o,n)=>String.fromCharCode(...b.slice(o,o+n));
    return {riff:s(0,4),wave:s(8,4),fmt:s(12,4),pcm:v.getUint16(20,true),ch:v.getUint16(22,true),sr:v.getUint32(24,true),
      byteRate:v.getUint32(28,true),bits:v.getUint16(34,true),data:s(36,4),dataLen:v.getUint32(40,true),riffLen:v.getUint32(4,true),
      total:b.length,first:v.getInt16(44,true),last:v.getInt16(50,true)};})()`);
  assert.deepEqual(info, { riff: 'RIFF', wave: 'WAVE', fmt: 'fmt ', pcm: 1, ch: 2, sr: 48000, byteRate: 192000, bits: 16,
    data: 'data', dataLen: 8, riffLen: 44, total: 52, first: 1, last: -32768 });
});

test('samples are clipped to the 16-bit range', () => {
  assert.equal(t.get('floatToInt16(2)'), 32767);
  assert.equal(t.get('floatToInt16(-2)'), -32768);
  assert.equal(t.get('floatToInt16(0.5)'), 16384);
  assert.equal(t.get('floatToInt16(NaN)'), 0);
});
