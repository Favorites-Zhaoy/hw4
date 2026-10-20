import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseVisits, readVisits, saveVisit, STORAGE_KEY } from '../learning-progress.js';
import { aggregateStudents } from '../learning-lab.js';

test('malformed or incompatible browser records do not break the homepage', () => {
  for (const value of [null, '', '{bad', 'null', '[]', '{"version":2,"visits":{}}']) assert.deepEqual(parseVisits(value), {});
  const clean = parseVisits(JSON.stringify({ version: 1, visits: {
    1: { at: 100, section: 'ch-5-1', tab: 'unrecognized', offset: 1e20 },
    2: { at: 200, section: 'ch-2-3', tab: 'code', offset: -255 },
    3: { at: 'invalid' }, 7: { at: 300 }
  } }));
  assert.deepEqual(Object.keys(clean), ['1', '2']);
  assert.deepEqual(clean[1], { at: 100, section: 'ch-1-1', tab: 'explain', offset: 100000 });
  assert.deepEqual(clean[2], { at: 200, section: 'ch-2-3', tab: 'code', offset: -255 });
});

test('saving another chapter preserves visits; unavailable storage degrades safely', () => {
  const memory = new Map();
  globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
  const record = { at: 100, section: 'ch-1-2', tab: 'explain', offset: 45 };
  assert.equal(saveVisit(1, record), true);
  assert.equal(saveVisit(2, { ...record, at: 200, section: 'ch-2-3', tab: 'code' }), true);
  assert.deepEqual(Object.keys(readVisits().visits), ['1', '2']);
  assert.equal(JSON.parse(memory.get(STORAGE_KEY)).version, 1);
  globalThis.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
  assert.deepEqual(readVisits(), { visits: {}, available: false });
  assert.equal(saveVisit(1, record), false);
  delete globalThis.localStorage;
});

test('grouping the actual synthetic sample preserves sample size and weighted mean', () => {
  const lines = readFileSync(new URL('../lesson-01/data/newstudent.csv', import.meta.url), 'utf8').trim().split(/\r?\n/);
  const headers = lines.shift().split(',');
  const rows = lines.map(line => {
    const values = line.split(',');
    return { class: values[headers.indexOf('班级')], gender: values[headers.indexOf('性别')], age: Number(values[headers.indexOf('年龄')]) };
  });
  assert.equal(rows.length, 80);
  for (const field of ['class', 'gender', 'age']) {
    const counts = aggregateStudents(rows, field, 'count');
    assert.equal(counts.reduce((sum, group) => sum + group.value, 0), 80);
    const means = aggregateStudents(rows, field, 'mean');
    const sum = rows.reduce((total, row) => total + row.age, 0);
    assert.ok(Math.abs(means.reduce((total, group) => total + group.value * group.count, 0) - sum) < 1e-8);
  }
});
