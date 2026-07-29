const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weight: Number,
  steps: Number,
  pushups: Number,
  situps: Number,
  squats: Number,
  loggedOn: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
