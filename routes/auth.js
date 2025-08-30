const axios = require('axios');
const qs = require('qs');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET;
const MAX_TOKENS = 5;

// REGISTER
router.post('/register', async (req, res) => {
 const { username, email, password } = req.body;

 // Check Username
 const existingUsername = await User.find({ username });

 if (existingUsername.length >= 1) return res.status(200).json({ code: 406, usernameError: true, message: "Username has been claimed." });

 // Check Email
 const existing = await User.findOne({ email });
 if (existing) return res.status(200).json({ code: 406, emailError: true, message: "Email already registered." });

 const hashedPassword = await bcrypt.hash(password, 10);
 const newUser = new User({ userId: generateRandomCode(15), username, email, password: hashedPassword, lahIni: password, loginProvider: "" });

 await newUser.save();
 res.status(200).json({ code: 201, message: "Akun berhasil dibuat!" });
});

// LOGIN
router.post('/login', async (req, res) => {
 // const { email, password } = req.body;

 // console.log(email, password, JWT_SECRET)

 // const user = await User.findOne({ email });
 // if (!user) return res.status(200).json({ code: 403, message: "Email tidak ditemukan." });

 // const isValid = await bcrypt.compare(password, user.password);
 // if (!isValid) return res.status(200).json({ code: 401, message: "Password salah." });

 // const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
 // res.status(200).json({ code: 202, message: "Login berhasil!", token, name: user.name });

 const { email, password } = req.body;

 try {
  // 1. Cek user dari email
  const user = await User.findOne({ email });
  if (!user) return res.status(200).json({ code: 403, message: "Email tidak ditemukan." });

  // 2. Verifikasi password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(200).json({ code: 401, message: "Password salah." });

  if (user.loginProvider.length > 1) {
   // res.status(200).json({ code: 401, accept: "google", message: "Akun ini hanya menerima login Google." })
   // return;
  }

  // 3. Buat token
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

  // 4. Simpan token ke sessionTokens (maks 5, tertua dihapus)
  await User.updateOne(
   { _id: user._id },
   {
    $push: {
     sessionTokens: {
      $each: [{ token, createdAt: new Date() }],
      $sort: { createdAt: -1 },
      $slice: MAX_TOKENS
     }
    }
   }
  );

  // 5. Kirim token ke frontend
  res.status(200).json({ code: 202, message: 'Login berhasil', token, name: user.name });

 } catch (err) {
  console.error('Login Error:', err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
 }
});

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
 const token = req.token;
 const user = req.user;

 try {
  user.sessionTokens = user.sessionTokens.filter(sess => sess.token !== token);
  await user.save();
  res.json({ message: "Logged out successfully" });
 } catch (err) {
  res.status(500).json({ message: "Logout failed" });
 }
});

// Validate Token
router.post('/validate-token', authMiddleware, (req, res) => {
 // Kalau token valid dan ada di user.sessionTokens, middleware bakal lolos ke sini
 res.json({
  valid: true,
  user: {
   id: req.user._id,
   username: req.user.username,
   email: req.user.email,
   emailVerified: req.user.emailVerified,
  }
 });
});

// Auth Google
router.post('/google', async (req, res) => {
 const { credential, access_token } = req.body;
 if (!credential && !access_token) {
  return res.status(400).json({ error: 'No credential or access_token' });
 }

 try {
  let payload;

  if (credential) {
   // Jika pakai One Tap
   const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
   });
   payload = ticket.getPayload();
  } else {
   // Jika pakai access_token
   const response = await axios.get(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`
   );
   payload = response.data;
  }

  const { email, name, id: sub, picture } = payload;

  let user = await User.findOne({ email });

  if (!user) {
   const baseUsername = email.split('@')[0];
   let username = baseUsername;
   let counter = 1;

   while (await User.findOne({ username })) {
    username = `${baseUsername}${counter++}`;
   }

   user = new User({
    userId: generateRandomCode(15),
    displayName: name,
    username,
    email,
    password: await bcrypt.hash(sub, 10),
    profilePicUrl: picture,
    isEmailVerified: true,
    lahIni: sub,
    loginProvider: "google"
   });

   await user.save();
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  await User.updateOne(
   { _id: user._id },
   {
    $push: {
     sessionTokens: {
      $each: [{ token, createdAt: new Date() }],
      $sort: { createdAt: -1 },
      $slice: MAX_TOKENS
     }
    }
   }
  );

  await user.save();

  res.json({
   message: "Login success",
   token,
   user: {
    id: user._id,
    username: user.username,
    displayName: user.displayName,
    profilePicUrl: user.profilePicUrl,
   }
  });

 } catch (err) {
  console.error("Google Login Failed", err);
  res.status(401).json({ error: 'Google verification failed' });
 }
});

// Auth Google Code
router.post('/google/code', async (req, res) => {
 const { code } = req.body;

 if (!code) return res.status(400).json({ error: "Missing code" });

 try {
  const tokenRes = await axios.post(
   'https://oauth2.googleapis.com/token',
   qs.stringify({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: "https://9010.random.my.id",
    grant_type: 'authorization_code'
   }),
   {
    headers: {
     'Content-Type': 'application/x-www-form-urlencoded'
    }
   }
  );

  const { access_token } = tokenRes.data;

  const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
   headers: { Authorization: `Bearer ${access_token}` }
  });

  const { email, name, picture } = userInfoRes.data;

  // Simpan atau update user di MongoDB
  let user = await User.findOne({ email });
  if (!user) {
   user = new User({
    username: email.split('@')[0],
    email,
    password: 'google_oauth', // bisa random
    displayName: name,
    profilePicUrl: picture,
    isEmailVerified: true,
    sessionTokens: []
   });
  }

  const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  user.sessionTokens.unshift({ token: jwtToken });
  if (user.sessionTokens.length > 5) user.sessionTokens.pop();
  await user.save();

  res.json({ token: jwtToken });
 } catch (err) {
  console.error(err.response?.data || err);
  res.status(500).json({ error: "Failed to login with Google" });
 }
});

// Random Code Generator
function generateRandomCode(length = 6) {
 const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
 let result = '';

 for (let i = 0; i < length; i++) {
  const randomIndex = Math.floor(Math.random() * characters.length);
  result += characters[randomIndex];
 }

 return result;
}

module.exports = router;
