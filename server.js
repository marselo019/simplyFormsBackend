// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const axios = require('axios');
// const cors = require('cors');

// const port = 3000;

// const authRoutes = require('./routes/auth');
// const accountRoutes = require('./routes/account');
// const emailRoutes = require('./routes/email');
// const formsRoutes = require('./routes/forms');

// const app = express();
// app.use(express.json());
// app.use(cors());

// mongoose.connect(process.env.MONGO_URI, {
//  // useNewUrlParser: true,
//  // useUnifiedTopology: true,
// })
//  .then(() => console.log("🟢 Connected to MongoDB"))
//  .catch(err => console.error("❌ Mongo Error:", err));

// app.use('/api/auth', authRoutes);
// app.use('/api/account', accountRoutes);
// app.use('/api/account/email', emailRoutes);
// app.use('/api/forms', formsRoutes);
// app.get('/', (req, res) => {
//  res.send('hai');
// });
// app.get('/api/keep-alive', (req, res) => {
//  res.status(200).json({ message: "Oke, saya bangun dan aktif!" });
// });

// app.listen(port, () => {
//  console.log(`🚀 Server running on http://localhost:${port}`);
// });


// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { pathToRegexp } = require('path-to-regexp');

const port = 3000;

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const emailRoutes = require('./routes/email');
const formsRoutes = require('./routes/forms');

const app = express();
app.use(express.json());
app.use(cors());

// Fungsi koneksi MongoDB
const connectWithRetry = () => {
 console.log('Mencoba menghubungkan ke MongoDB...');

 return mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
 })
  .then(() => {
   console.log('✅ MongoDB terhubung sukses');

   // ✅ PINDAHKAN VALIDASI & REGISTRASI ROUTES SETELAH KONEKSI
   validateAndRegisterRoutes();
  })
  .catch(err => {
   console.error('❌ Gagal terhubung ke MongoDB:', err.message);
   console.log('🔄 Mencoba lagi dalam 5 detik...');
   setTimeout(connectWithRetry, 5000);
  });
};

// Fungsi validasi dan registrasi routes
function validateAndRegisterRoutes() {
 try {
  console.log('\n🔍 Validating routes after MongoDB connection...');

  // Validasi routes
  validateRoutes(authRoutes, 'auth');
  validateRoutes(accountRoutes, 'account');
  validateRoutes(emailRoutes, 'email');
  validateRoutes(formsRoutes, 'forms');

  // Registrasi routes
  app.use('/api/auth', authRoutes);
  app.use('/api/account', accountRoutes);
  app.use('/api/account/email', emailRoutes);
  app.use('/api/forms', formsRoutes);

  console.log('✅ All routes registered successfully after MongoDB connection');

 } catch (error) {
  console.error('❌ Route registration failed:', error.message);
  process.exit(1);
 }
}

// Fungsi validasi routes
function validateRoutes(routes, routeName) {
 console.log(`🔍 Validating ${routeName} routes...`);

 routes.stack.forEach((layer) => {
  if (layer.route) {
   const path = layer.route.path;
   if (!validateRoutePath(path)) {
    throw new Error(`Invalid route in ${routeName}: ${path}`);
   }
  }
 });
}

function validateRoutePath(path) {
 try {
  pathToRegexp(path); // ✅ Gunakan import yang sudah dilakukan
  return true;
 } catch (error) {
  console.error(`❌ Invalid route path: ${path}`);
  console.error(`   Error: ${error.message}`);
  return false;
 }
}
// Routes dasar
app.get('/', (req, res) => {
 res.send('Server SimplyForms API aktif!');
});

app.get('/health', (req, res) => {
 const status = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
 res.json({
  status,
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  timestamp: new Date().toISOString()
 });
});

// Jalankan koneksi
connectWithRetry();

app.listen(port, () => {
 console.log(`🚀 Server running on port ${port}`);
});