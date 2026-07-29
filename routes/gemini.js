const express = require('express');
const WorkoutLog = require('../models/WorkoutLog');
const { requireAuthApi } = require('../middleware/auth');

const router = express.Router();
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

router.post('/ask', requireAuthApi, async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const { prompt } = req.body;
    const recent = await WorkoutLog.find({ user: req.user.id }).sort({ loggedOn: -1 }).limit(5);

    const fullPrompt = `You are an encouraging AI fitness coach for the LevelUp AI app.
Speak directly to the user, keep it under 60 words, and base any specific comments only on
the stats below - never invent numbers.

Recent workout logs: ${JSON.stringify(recent)}

User's message: ${prompt || '(no message, just give a general tip)'}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: fullPrompt }] }] })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini error:', errText);
      return res.status(502).json({ error: 'Gemini request failed.' });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') ||
      'Stay consistent - small progress every day adds up.';

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/workout-plan', requireAuthApi, async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const { goal, daysPerWeek, focus, experience } = req.body;
    const latest = (await WorkoutLog.findOne({ user: req.user.id }).sort({ loggedOn: -1 })) || {};

    const prompt = `You are a certified personal trainer inside the LevelUp AI fitness app.
Create a workout plan based on these preferences:

Goal: ${goal || 'general fitness'}
Days per week available: ${daysPerWeek || 3}
Focus areas: ${focus || 'full body'}
Experience level: ${experience || 'beginner'}
Most recent logged stats (may be empty): ${JSON.stringify(latest)}

Format the plan as one line per day, like:
Day 1 - <focus>: <exercise> (<sets>x<reps>), <exercise> (<sets>x<reps>), ...
Day 2 - Rest, or another day's focus, etc.

Keep it concise - no long intros or disclaimers, just the day-by-day plan. Limit to
${daysPerWeek || 3} training days plus rest days to fill a 7-day week.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini error:', errText);
      return res.status(502).json({ error: 'Gemini request failed.' });
    }

    const data = await response.json();
    const plan = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') ||
      'Could not generate a plan right now - try again in a moment.';

    res.json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
