const express = require('express');
const WorkoutLog = require('../models/WorkoutLog');
const { requireAuthApi } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuthApi, async (req, res) => {
  try {
    const { weight, steps, pushups, situps, squats } = req.body;
    const log = await WorkoutLog.create({
      user: req.user.id,
      weight: weight || undefined,
      steps: steps || undefined,
      pushups: pushups || undefined,
      situps: situps || undefined,
      squats: squats || undefined
    });
    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save workout.' });
  }
});

module.exports = router;
