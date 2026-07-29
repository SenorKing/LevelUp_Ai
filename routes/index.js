const express = require('express');
const WorkoutLog = require('../models/WorkoutLog');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { requireAuthPage } = require('../middleware/auth');
const { getTotalXp } = require('../services/xp');
const { getLevelInfo } = require('../utils/leveling');

const router = express.Router();

// Small helper: attaches req.user if a valid cookie exists, never blocks.
function attachUser(req, res, next) {
  const jwt = require('jsonwebtoken');
  const token = req.cookies.token;
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch (e) { /* ignore */ }
  }
  next();
}

router.get('/', attachUser, (req, res) => {
  res.redirect(req.user ? '/dashboard' : '/login');
});

router.get('/login', attachUser, (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('login');
});

router.get('/signup', attachUser, (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('signup');
});

router.get('/dashboard', requireAuthPage, async (req, res) => {
  const latest = (await WorkoutLog.findOne({ user: req.user.id }).sort({ loggedOn: -1 })) || {};
  const totalXp = await getTotalXp(req.user.id);
  const levelInfo = getLevelInfo(totalXp);

  const [recentWorkouts, recentActivities] = await Promise.all([
    WorkoutLog.find({ user: req.user.id }).sort({ loggedOn: -1 }).limit(5),
    ActivityLog.find({ user: req.user.id }).sort({ loggedOn: -1 }).limit(5)
  ]);

  const recentActivity = [...recentWorkouts.map(w => ({
    loggedOn: w.loggedOn,
    text: `Logged stats — ${[
      w.weight ? `${w.weight} lbs` : null,
      w.steps ? `${w.steps} steps` : null,
      w.pushups ? `${w.pushups} pushups` : null,
      w.situps ? `${w.situps} sit-ups` : null,
      w.squats ? `${w.squats} squats` : null
    ].filter(Boolean).join(', ') || 'no details'}`
  })), ...recentActivities.map(a => ({
    loggedOn: a.loggedOn,
    text: `${a.type.charAt(0).toUpperCase() + a.type.slice(1)} for ${a.durationMinutes} min (+${a.xpEarned} XP)`
  }))]
    .sort((a, b) => b.loggedOn - a.loggedOn)
    .slice(0, 6)
    .map(item => item.text);

  res.render('dashboard', {
    user: req.user,
    latest,
    levelInfo,
    todaysWorkout: null,
    quote: 'We must all suffer one of two things: the pain of discipline or the pain of regret. — Jim Rohn',
    recentActivity
  });
});

router.get('/workout', requireAuthPage, async (req, res) => {
  const latest = (await WorkoutLog.findOne({ user: req.user.id }).sort({ loggedOn: -1 })) || {};
  const history = await WorkoutLog.find({ user: req.user.id }).sort({ loggedOn: -1 }).limit(5);
  const workoutCount = await WorkoutLog.countDocuments({ user: req.user.id });
  const activityHistory = await ActivityLog.find({ user: req.user.id }).sort({ loggedOn: -1 }).limit(5);

  res.render('workout', {
    user: req.user,
    latest,
    history,
    workoutCount,
    activityHistory,
    activityTypes: Object.keys(ActivityLog.XP_RATES),
    streak: 0
  });
});

router.get('/motivation', requireAuthPage, async (req, res) => {
  const totalXp = await getTotalXp(req.user.id);
  const levelInfo = getLevelInfo(totalXp);

  res.render('motivation', {
    user: req.user,
    levelInfo,
    streak: 0,
    goal: 'Log a workout today',
    aiMessage: 'Stay consistent today. Small progress every day leads to huge improvements.',
    quote: 'The pain you feel today will become the strength you need tomorrow.',
    missions: [
      { done: false, label: 'Walk 10,000 steps' },
      { done: false, label: 'Drink 2L of water' },
      { done: false, label: 'Complete your workout' }
    ],
    videos: [
      { youtubeId: 'mgmVOuLgFB0' },
      { youtubeId: 'ZXsQAXx_ao0' },
      { youtubeId: 'wnHW6o8WMas' }
    ]
  });
});

router.get('/profile', requireAuthPage, async (req, res) => {
  const user = await User.findById(req.user.id);
  const workoutCount = await WorkoutLog.countDocuments({ user: req.user.id });
  const totalXp = await getTotalXp(req.user.id);
  const levelInfo = getLevelInfo(totalXp);

  res.render('profile', {
    user: req.user,
    memberSince: user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    stats: { workoutCount },
    levelInfo
  });
});

module.exports = router;
