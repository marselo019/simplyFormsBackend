const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get account data
router.get('/me', auth, async (req, res) => {
 const { _id, username, displayName, email, isEmailVerified: emailVerified, profilePicUrl, createdAt, lahIni: essentialicPw } = req.user;
 res.json({ _id, username, displayName, email, emailVerified, profilePicUrl, createdAt, essentialicPw });
});

// Update user field
router.post('/update', auth, async (req, res) => {
 const { field, value } = req.body;

 if (!['username', 'displayName', 'email', 'password', 'profilePicUrl'].includes(field)) {
  return res.status(400).json({ error: 'Field not allowed' });
 }

 if (field == "password") {
  req.user.lahIni = value;
  req.user[field] = await bcrypt.hash(value, 10);
 } else {
  req.user[field] = value;
 }

 if (field === 'email') req.user.isEmailVerified = false;

 await req.user.save();
 res.json({ success: true });
});

// Send verification email placeholder
router.post('/resend-verification', auth, async (req, res) => {
 // Nanti bisa pakai nodemailer untuk kirim link verifikasi
 res.json({ message: 'Email verifikasi terkirim (simulasi)' });
});

module.exports = router;