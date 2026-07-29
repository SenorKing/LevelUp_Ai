const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { requireAuthApi } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuthApi, async (req, res) => {
  try {
    const { type, durationMinutes, note } = req.body;
    const rates = ActivityLog.XP_RATES;

    if (!type || !rates[type]) {
      return res.status(400).json({ error: 'Pick a valid activity type.' });
    }
    const duration = Number(durationMinutes);
    if (!duration || duration <= 0) {
      return res.status(400).json({ error: 'Enter a duration greater than 0.' });
    }

    const xpEarned = Math.round(duration * rates[type]);
    const log = await ActivityLog.create({
      user: req.user.id,
      type,
      durationMinutes: duration,
      xpEarned,
      note: note || undefined
    });
    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save activity.' });
  }
});

router.get('/', requireAuthApi, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ user: req.user.id }).sort({ loggedOn: -1 }).limit(10);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load activities.' });
  }
});

module.exports = router;
