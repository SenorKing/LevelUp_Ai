const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// An in-memory stand-in for the WorkoutLog model, so these tests need no database.
// It applies the same filters the real queries use: user, loggedOn >= start, weight > 0.
function installFakeModel(rows) {
  const modelPath = require.resolve(path.join('..', 'models', 'WorkoutLog'));
  const query = (matches) => {
    let list = rows.filter(matches);
    const q = {
      sort: () => { list = [...list].sort((a, b) => b.loggedOn - a.loggedOn); return q; },
      select: () => q,
      lean: () => q,
      then: (resolve, reject) => Promise.resolve(list).then(resolve, reject)
    };
    return q;
  };
  const fake = {
    find: (f) => query((r) => r.user === f.user && r.loggedOn >= f.loggedOn.$gte),
    findOne: (f) => {
      const q = query((r) => r.user === f.user && r.weight > f.weight.$gt);
      const done = q.then;
      q.then = (resolve, reject) => done((list) => resolve(list[0] || null), reject);
      return q;
    }
  };
  require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: fake };
  delete require.cache[require.resolve('../services/stats')];
  return require('../services/stats');
}

test('startOfDay: New York evening still belongs to the same local day', () => {
  const { startOfDay } = installFakeModel([]);
  // 22:30 on Nov 8 in New York (EST) is 03:30 UTC on Nov 9
  const start = startOfDay('America/New_York', new Date('2026-11-09T03:30:00Z'));
  assert.equal(start.toISOString(), '2026-11-08T05:00:00.000Z');
});

test('startOfDay: summer time (EDT) uses a 4 hour offset', () => {
  const { startOfDay } = installFakeModel([]);
  const start = startOfDay('America/New_York', new Date('2026-07-01T02:00:00Z'));
  assert.equal(start.toISOString(), '2026-06-30T04:00:00.000Z');
});

test('startOfDay: day the clocks go back still starts at local midnight', () => {
  const { startOfDay } = installFakeModel([]);
  // Nov 1, 2026: clocks go back at 2am. Local midnight is still EDT (UTC-4).
  const start = startOfDay('America/New_York', new Date('2026-11-01T12:00:00Z'));
  assert.equal(start.toISOString(), '2026-11-01T04:00:00.000Z');
});

test('startOfDay: zone ahead of UTC (Tokyo)', () => {
  const { startOfDay } = installFakeModel([]);
  const start = startOfDay('Asia/Tokyo', new Date('2026-11-09T20:00:00Z'));
  assert.equal(start.toISOString(), '2026-11-09T15:00:00.000Z');
});

test('resolveTimeZone: bad or missing zone falls back to UTC', () => {
  const { resolveTimeZone } = installFakeModel([]);
  assert.equal(resolveTimeZone('Not/AZone'), 'UTC');
  assert.equal(resolveTimeZone(undefined), 'UTC');
  assert.equal(resolveTimeZone('Europe/London'), 'Europe/London');
});

test('sumLogs: adds fields across logs and treats missing values as 0', () => {
  const { sumLogs } = installFakeModel([]);
  const totals = sumLogs([{ steps: 1000 }, { steps: 500, pushups: 20 }, {}]);
  assert.deepEqual(totals, { steps: 1500, pushups: 20, situps: 0, squats: 0 });
});

test('the bug: weight logged Monday survives a pushups-only log on Tuesday', async () => {
  const rows = [
    { user: 'u1', weight: 180.5, loggedOn: new Date('2026-11-09T15:00:00Z') }, // Mon 10am ET
    { user: 'u1', pushups: 25, loggedOn: new Date('2026-11-10T15:00:00Z') }    // Tue 10am ET
  ];
  const { getDailyStats } = installFakeModel(rows);
  const stats = await getDailyStats('u1', 'America/New_York', new Date('2026-11-10T20:00:00Z'));
  assert.equal(stats.weight, 180.5);
  assert.equal(stats.weightNote, 'Last logged Nov 9');
  assert.equal(stats.pushups, 25);
});

test("today's totals add up several logs and ignore earlier days", async () => {
  const rows = [
    { user: 'u1', steps: 9000, loggedOn: new Date('2026-11-09T15:00:00Z') },  // yesterday
    { user: 'u1', steps: 3000, squats: 40, loggedOn: new Date('2026-11-10T14:00:00Z') },
    { user: 'u1', steps: 2500, pushups: 10, loggedOn: new Date('2026-11-10T19:00:00Z') },
    { user: 'u2', steps: 99999, loggedOn: new Date('2026-11-10T19:00:00Z') }  // someone else
  ];
  const { getDailyStats } = installFakeModel(rows);
  const stats = await getDailyStats('u1', 'America/New_York', new Date('2026-11-10T20:00:00Z'));
  assert.equal(stats.steps, 5500);
  assert.equal(stats.squats, 40);
  assert.equal(stats.pushups, 10);
  assert.equal(stats.situps, 0);
});

test('a log from 11:30pm New York time still counts as that day, not tomorrow (UTC)', async () => {
  const rows = [{ user: 'u1', steps: 4000, loggedOn: new Date('2026-11-10T04:30:00Z') }]; // Nov 9, 11:30pm EST
  const { getDailyStats } = installFakeModel(rows);
  const stats = await getDailyStats('u1', 'America/New_York', new Date('2026-11-10T04:45:00Z'));
  assert.equal(stats.steps, 4000);
});

test('no logs at all: zeros and no weight', async () => {
  const { getDailyStats } = installFakeModel([]);
  const stats = await getDailyStats('u1', 'UTC', new Date('2026-11-10T12:00:00Z'));
  assert.deepEqual(
    { steps: stats.steps, pushups: stats.pushups, situps: stats.situps, squats: stats.squats, weight: stats.weight, weightNote: stats.weightNote },
    { steps: 0, pushups: 0, situps: 0, squats: 0, weight: null, weightNote: '' }
  );
});

test('weight logged today is labelled as today, and a weight of 0 is ignored', async () => {
  const rows = [
    { user: 'u1', weight: 181, loggedOn: new Date('2026-11-10T14:00:00Z') },
    { user: 'u1', weight: 0, loggedOn: new Date('2026-11-10T15:00:00Z') }
  ];
  const { getDailyStats } = installFakeModel(rows);
  const stats = await getDailyStats('u1', 'America/New_York', new Date('2026-11-10T20:00:00Z'));
  assert.equal(stats.weight, 181);
  assert.equal(stats.weightNote, 'Logged today');
});
