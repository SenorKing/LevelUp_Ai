const mongoose = require('mongoose');

// XP earned per minute, by activity type. Adjust these freely to rebalance.
const XP_RATES = {
  hiking: 1,
  swimming: 1.2,
  sports: 1,
  running: 1.1,
  cycling: 0.9,
  yoga: 0.6,
  other: 0.5
};

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: Object.keys(XP_RATES), required: true },
  durationMinutes: { type: Number, required: true, min: 1 },
  xpEarned: { type: Number, required: true },
  note: String,
  loggedOn: { type: Date, default: Date.now }
}, { timestamps: true });

activityLogSchema.statics.XP_RATES = XP_RATES;

module.exports = mongoose.model('ActivityLog', activityLogSchema);
