const mongoose = require('mongoose');
const WorkoutLog = require('../models/WorkoutLog');
const ActivityLog = require('../models/ActivityLog');

const XP_PER_WORKOUT_LOG = 10;

async function getTotalXp(userId) {
  const workoutCount = await WorkoutLog.countDocuments({ user: userId });

  const activityAgg = await ActivityLog.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$xpEarned' } } }
  ]);
  const activityXp = activityAgg[0]?.total || 0;

  return workoutCount * XP_PER_WORKOUT_LOG + activityXp;
}

module.exports = { getTotalXp };
