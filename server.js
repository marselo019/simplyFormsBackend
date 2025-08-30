require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ✅ IMPORT ROUTES
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const emailRoutes = require('./routes/email');
const formsRoutes = require('./routes/forms');

// ✅ CONNECTION OPTIMIZED FOR VERCEL
const connectDB = async () => {
 try {
  console.log('🔄 Connecting to MongoDB...');

  const conn = await mongoose.connect(process.env.MONGO_URI, {
   serverSelectionTimeoutMS: 10000,
   socketTimeoutMS: 45000,
   family: 4,
   maxPoolSize: 10,
   minPoolSize: 1,
   maxIdleTimeMS: 30000
  });

  console.log('✅ MongoDB Connected Successfully:', conn.connection.host);
  return true;
 } catch (error) {
  console.error('❌ MongoDB Connection Failed:', error.message);
  console.log('⚠️  Application will run without database');
  return false;
 }
};

// ✅ INITIALIZE CONNECTION ON SERVER START
connectDB();

// ✅ GRACEFUL SHUTDOWN HANDLING
process.on('SIGINT', async () => {
 await mongoose.connection.close();
 process.exit(0);
});

// ✅ REGISTER ROUTES (YANG INI YANG KETINGGALAN!)
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/forms', formsRoutes);

// ✅ BASIC ROUTES
app.get('/', (req, res) => {
 res.json({
  status: 'OK',
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  timestamp: new Date().toISOString()
 });
});

app.get('/health', async (req, res) => {
 const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';

 res.json({
  status: 'OK',
  database: dbStatus,
  readyState: mongoose.connection.readyState,
  timestamp: new Date().toISOString()
 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
 console.log(`🚀 Server running on port ${PORT}`);
 console.log(`📊 MongoDB Connection State: ${mongoose.connection.readyState}`);
});