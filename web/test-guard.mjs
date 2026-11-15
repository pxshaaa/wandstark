import assert from 'node:assert/strict';
import { Guard } from './src/worker.js';
let now = 1_700_000_000_000; Date.now = () => now;
const mem = new Map(); const storage = { get: async k => structuredClone(mem.get(k)), put: async (k, v) => { mem.set(k, structuredClone(v)); }, delete: async k => mem.delete(k) };
const g = new Guard({ storage });
const call = async (p, ip) => (await g.fetch(new Request(`https://g/${p}?ip=${ip}`))).json();
let n = 0, ok = 0; const t = async (name, fn) => { n++; await fn(); ok++; };
await t('4 fails leave 1 attempt', async () => { for (let i = 0; i < 4; i++) await call('fail', 'A'); assert.equal((await call('check', 'A')).locked, false); });
await t('5th fail locks IP for 15 min', async () => { const r = await call('fail', 'A'); assert.equal(r.locked, true); assert.equal(r.wait, 900); });
await t('other IP not locked by per-IP rule', async () => { assert.equal((await call('check', 'B')).locked, false); });
await t('lock expires after 15 min', async () => { now += 900e3 + 1; assert.equal((await call('check', 'A')).locked, false); });
await t('second lockout doubles to 30 min', async () => { let r; for (let i = 0; i < 5; i++) r = await call('fail', 'A'); assert.equal(r.wait, 1800); });
await t('success resets IP record', async () => { now += 1800e3 + 1; await call('ok', 'A'); for (let i = 0; i < 4; i++) await call('fail', 'A'); assert.equal((await call('check', 'A')).locked, false); });
await t('global: 20 fails/hour from many IPs lock all logins 1 h', async () => {
  mem.clear(); now += 7200e3; let r; for (let i = 0; i < 20; i++) r = await call('fail', 'ip' + i);
  assert.equal(r.locked, true); assert.equal((await call('check', 'fresh-ip')).locked, true); assert.equal((await call('check', 'fresh-ip')).wait, 3600);
  now += 3600e3 + 1; assert.equal((await call('check', 'fresh-ip')).locked, false); });
await t('global window slides (old fails expire)', async () => {
  mem.clear(); for (let i = 0; i < 19; i++) await call('fail', 'x' + i); now += 3600e3 + 1; const r = await call('fail', 'y'); assert.equal(r.locked, false); });
await t('lock cap 24 h', async () => { mem.clear(); let r; for (let k = 0; k < 9; k++) { for (let i = 0; i < 5; i++) r = await call('fail', 'Z'); now += r.wait * 1000 + 1; mem.delete('global'); } assert.equal(r.wait, 86400); });
console.log(`PASS ${ok}/${n}`);
