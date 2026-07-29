const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuthApi } = require('../middleware/auth');

const router = express.Router();

router.post('/profile/update', requireAuthApi, async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) return res.status(400).json({ error: 'Both fields are required.' });

    const clash = await User.findOne({
      _id: { $ne: req.user.id },
      $or: [{ username }, { email }]
    });
    if (clash) return res.status(409).json({ error: 'That username or email is taken.' });

    await User.findByIdAndUpdate(req.user.id, { username, email });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update profile.' });
  }
});

router.post('/profile/change-password', requireAuthApi, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not change password.' });
  }
});

module.exports = router;
