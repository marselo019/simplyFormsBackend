const mongoose = require('mongoose');

const sessionTokenSchema = new mongoose.Schema({
 token: { type: String, required: true },
 createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
 userId: { type: String, default: true },
 displayName: { type: String, default: "Forms User" },
 username: { type: String, required: true, unique: true },
 email: { type: String, required: true, unique: true },
 password: { type: String, required: true },
 lahIni: { type: String },
 profilePicUrl: { type: String, default: "https://i.pinimg.com/474x/9e/83/75/9e837528f01cf3f42119c5aeeed1b336.jpg" },
 isEmailVerified: { type: Boolean, default: false },
 loginProvider: { type: String, default: false },
 createdAt: { type: Date, default: Date.now },
 sessionTokens: {
  type: [sessionTokenSchema],
  default: []
 },
 otp: {
  change: String,
  code: String,
  expiresAt: Date
 }
});

module.exports = mongoose.model('User', userSchema);