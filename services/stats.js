const WorkoutLog = require('../models/WorkoutLog');

// Stats that add up over a day. Weight is different: it is a reading, not a total.
const DAILY_FIELDS = ['steps', 'pushups', 'situps', 'squats'];

// Returns tz if it is a valid IANA time zone name (e.g. "America/New_York"), otherwise "UTC".
function resolveTimeZone(tz) {
  if (typeof tz === 'string' && tz) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
      return tz;
    } catch (err) {
      // fall through to UTC
    }
  }
  return 'UTC';
}

// The wall-clock date and time of an instant, as seen in the given time zone.
function zonedParts(ms, tz) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  });
  const parts = {};
  for (const { type, value } of formatter.formatToParts(new Date(ms))) {
    parts[type] = Number(value);
  }
  parts.hour = parts.hour % 24;
  return parts;
}

// How far the time zone's wall clock is ahead of UTC at this instant, in milliseconds.
function offsetAt(ms, tz) {
  const p = zonedParts(ms, tz);
  const wallClockAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wallClockAsUtc - (ms - (ms % 1000));
}

// The instant that "today" began in the given time zone.
function startOfDay(tz, now = new Date()) {
  const p = zonedParts(now.getTime(), tz);
  const midnightAsUtc = Date.UTC(p.year, p.month - 1, p.day);
  // Two passes so the offset is taken at the right side of a daylight saving change.
  let start = midnightAsUtc - offsetAt(midnightAsUtc, tz);
  start = midnightAsUtc - offsetAt(start, tz);
  return new Date(start);
}

// Adds up steps, pushups, sit-ups and squats across a list of logs. Missing fields count as 0.
function sumLogs(logs) {
  const totals = {};
  for (const field of DAILY_FIELDS) {
    totals[field] = logs.reduce((sum, log) => {
      const value = Number(log[field]);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
  }
  return totals;
}

function formatDay(date, tz) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: tz });
}

/**
 * What the dashboard and workout pages show:
 *  - weight: the most recent weight the user logged (even if it was days ago)
 *  - steps, pushups, situps, squats: totals for today in the user's time zone
 */
async function getDailyStats(userId, timeZone, now = new Date()) {
  const tz = resolveTimeZone(timeZone);
  const start = startOfDay(tz, now);

  const [todaysLogs, weightLog] = await Promise.all([
    WorkoutLog.find({ user: userId, loggedOn: { $gte: start } })
      .select(DAILY_FIELDS.join(' '))
      .lean(),
    WorkoutLog.findOne({ user: userId, weight: { $gt: 0 } })
      .sort({ loggedOn: -1 })
      .select('weight loggedOn')
      .lean()
  ]);

  let weightNote = '';
  if (weightLog) {
    weightNote = new Date(weightLog.loggedOn) >= start
      ? 'Logged today'
      : `Last logged ${formatDay(new Date(weightLog.loggedOn), tz)}`;
  }

  return {
    ...sumLogs(todaysLogs),
    weight: weightLog ? weightLog.weight : null,
    weightNote,
    timeZone: tz
  };
}

module.exports = { getDailyStats, startOfDay, sumLogs, resolveTimeZone };
