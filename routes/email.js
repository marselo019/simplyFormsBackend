const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const axios = require('axios');

router.post('/request-otp', auth, async (req, res) => {
 const { subject, message, change } = req.body;

 const user = await User.findById(req.user._id);
 if (!user) return res.status(404).json({ message: 'User not found' });

 console.log(user);

 const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
 const expiresAt = new Date(Date.now() + 5 * 60000); // 5 menit

 user.otp = { code: otpCode, expiresAt, change };
 await user.save();

 var categoryEmail;

 if (change == "emailVerified") categoryEmail = "Verifikasi Email";
 if (change == "password") categoryEmail = "Reset Password";

 const ress = axios.post(`https://api.brevo.com/v3/smtp/email`, {
  sender: {
   name: "OTP - SimplyForms",
   email: "otp@simplyforms.my.id"
  },

  to: [
   {
    email: user.email
   }
  ],

  subject: subject,
  htmlContent: `
   <!DOCTYPE html>
 <html lang="id">
 <head>
   <meta charset="UTF-8" />
   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
   <title>SimplyForms - Verifikasi Email</title>
   <style>
     body {
       background-color: #121212;
       color: #ffffff;
       font-family: 'Segoe UI', sans-serif;
       margin: 0;
       padding: 0;
     }

     .container {
       max-width: 600px;
       margin: 40px auto;
       padding: 30px;
       background: #1e1e1e;
       border-radius: 12px;
       box-shadow: 0 0 20px rgba(0,0,0,0.6);
     }

     h1 {
       font-size: 28px;
       margin-bottom: 10px;
       color: #00e5ff;
     }

     .description {
       font-size: 16px;
       margin-bottom: 30px;
       color: #cccccc;
       line-height: 1.5;
     }

     .category {
       font-size: 14px;
       color: #888;
       margin-bottom: 20px;
     }

     .code-box {
       font-size: 28px;
       font-weight: bold;
       letter-spacing: 10px;
       text-align: center;
       color: #00e5ff;
       background: #2c2c2c;
       padding: 16px;
       border-radius: 8px;
       margin-bottom: 30px;
     }

     .alt-text {
       text-align: center;
       margin: 20px 0 10px;
       font-size: 15px;
       color: #bbb;
     }

     .verify-button {
       display: block;
       text-align: center;
       margin: 0 auto 25px;
       padding: 14px 28px;
       background: #00e5ff;
       color: #121212;
       border: none;
       border-radius: 6px;
       text-decoration: none;
       font-weight: 600;
       transition: 0.3s ease;
     }

     .verify-button:hover {
       background-color: #00bcd4;
     }

     .fallback-link {
       font-size: 13px;
       color: #999;
       word-break: break-word;
       text-align: center;
       margin-top: 10px;
     }

     .fallback-link a {
       color: #00e5ff;
       text-decoration: none;
     }

     footer {
       margin-top: 50px;
       text-align: center;
       font-size: 12px;
       color: #555;
     }
   </style>
 </head>
 <body>
   <div class="container">
     <h1>SimplyForms</h1>
     <p class="description">
       Ini adalah kode verifikasi kamu. Jangan membagikan kode verifikasi ini kepada siapapun termasuk tim SimplyForms.
     </p>

     <div class="category">Kategori: ${categoryEmail}</div>

     <div class="code-box">${otpCode}</div> <!-- Ganti dengan kode dinamis -->

     <div class="alt-text">Atau verifikasi dengan:</div>

     <a href="https://simplyforms.my.id/verificationEmail?c=${otpCode}" class="verify-button">
       Verifikasi Sekarang
     </a>

     <div class="fallback-link">
       Jika tidak dapat mengklik button di atas, verifikasi lewat link ini:<br/>
       <a href="https://simplyforms.my.id/verificationEmail?c=${otpCode}">
         https://simplyforms.my.id/verificationEmail?c=${otpCode}
       </a>
     </div>

     <footer>
       © 2025 SimplyForms. All rights reserved.
     </footer>
   </div>
 </body>
 </html>

   `
 }, {
  headers: {
   'api-key': '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'
  }
 });
 //  const ress = axios.post(`https://api.postmarkapp.com/email`, {
 //   From: "otp@simplyforms.my.id",

 //   To: user.email,

 //   Subject: subject,
 //   HtmlBody: `
 //   <!DOCTYPE html>
 // <html lang="id">
 // <head>
 //   <meta charset="UTF-8" />
 //   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
 //   <title>SimplyForms - Verifikasi Email</title>
 //   <style>
 //     body {
 //       background-color: #121212;
 //       color: #ffffff;
 //       font-family: 'Segoe UI', sans-serif;
 //       margin: 0;
 //       padding: 0;
 //     }

 //     .container {
 //       max-width: 600px;
 //       margin: 40px auto;
 //       padding: 30px;
 //       background: #1e1e1e;
 //       border-radius: 12px;
 //       box-shadow: 0 0 20px rgba(0,0,0,0.6);
 //     }

 //     h1 {
 //       font-size: 28px;
 //       margin-bottom: 10px;
 //       color: #00e5ff;
 //     }

 //     .description {
 //       font-size: 16px;
 //       margin-bottom: 30px;
 //       color: #cccccc;
 //       line-height: 1.5;
 //     }

 //     .category {
 //       font-size: 14px;
 //       color: #888;
 //       margin-bottom: 20px;
 //     }

 //     .code-box {
 //       font-size: 28px;
 //       font-weight: bold;
 //       letter-spacing: 10px;
 //       text-align: center;
 //       color: #00e5ff;
 //       background: #2c2c2c;
 //       padding: 16px;
 //       border-radius: 8px;
 //       margin-bottom: 30px;
 //     }

 //     .alt-text {
 //       text-align: center;
 //       margin: 20px 0 10px;
 //       font-size: 15px;
 //       color: #bbb;
 //     }

 //     .verify-button {
 //       display: block;
 //       text-align: center;
 //       margin: 0 auto 25px;
 //       padding: 14px 28px;
 //       background: #00e5ff;
 //       color: #121212;
 //       border: none;
 //       border-radius: 6px;
 //       text-decoration: none;
 //       font-weight: 600;
 //       transition: 0.3s ease;
 //     }

 //     .verify-button:hover {
 //       background-color: #00bcd4;
 //     }

 //     .fallback-link {
 //       font-size: 13px;
 //       color: #999;
 //       word-break: break-word;
 //       text-align: center;
 //       margin-top: 10px;
 //     }

 //     .fallback-link a {
 //       color: #00e5ff;
 //       text-decoration: none;
 //     }

 //     footer {
 //       margin-top: 50px;
 //       text-align: center;
 //       font-size: 12px;
 //       color: #555;
 //     }
 //   </style>
 // </head>
 // <body>
 //   <div class="container">
 //     <h1>SimplyForms</h1>
 //     <p class="description">
 //       Ini adalah kode verifikasi kamu. Jangan membagikan kode verifikasi ini kepada siapapun termasuk tim SimplyForms.
 //     </p>

 //     <div class="category">Kategori: ${categoryEmail}</div>

 //     <div class="code-box">${otpCode}</div> <!-- Ganti dengan kode dinamis -->

 //     <div class="alt-text">Atau verifikasi dengan:</div>

 //     <a href="https://simplyforms.my.id/verificationEmail?c=${otpCode}" class="verify-button">
 //       Verifikasi Sekarang
 //     </a>

 //     <div class="fallback-link">
 //       Jika tidak dapat mengklik button di atas, verifikasi lewat link ini:<br/>
 //       <a href="https://simplyforms.my.id/verificationEmail?c=${otpCode}">
 //         https://simplyforms.my.id/verificationEmail?c=${otpCode}
 //       </a>
 //     </div>

 //     <footer>
 //       © 2025 SimplyForms. All rights reserved.
 //     </footer>
 //   </div>
 // </body>
 // </html>

 //   `,
 //   MessageStream: "outbond"
 //  }, {
 //   headers: {
 //    'X-Postmark-Server-Token': '60c87b61-6c8f-446b-8e52-6ef8260225c3'
 //   }
 //  });

 const dataa = ress.data;

 console.log(dataa);

 // // Kirim email OTP
 // const transporter = nodemailer.createTransport({
 //  host: 'smtp.mailgun.org',
 //  port: 465, // biasanya 465 (SSL) atau 587 (TLS)
 //  secure: true, // true = pakai SSL
 //  auth: {
 //   user: 'otp@simplyforms.my.id	',
 //   pass: "simplyforms" // atau password biasa / app password
 //  }
 // });

 // await transporter.sendMail({
 //  from: '"OTP - SimplyForms" <otp@simplyforms.my.id>',
 //  to: user.email,
 //  subject: subject,
 //  text: `${message}\nKode OTP Anda adalah: ${otpCode}\nAtau dengan:\nhttps://simplyforms.my.id/verificationEmail?c=${otpCode}. \n\n\nJangan pernah membagikan kode OTP ini ke siapapun termasuk Tim SimplyForms.`
 // });

 res.status(200).json({ code: 200, message: 'OTP sent to email' });
});

router.post('/verify-otp', auth, async (req, res) => {
 const { otp } = req.body;
 const user = await User.findById(req.user._id);

 if (!user || !user.otp || user.otp.code !== otp) {
  return res.status(200).json({ code: 400, message: 'OTP salah' });
 }

 if (user.otp.expiresAt < new Date()) {
  return res.status(200).json({ code: 400, message: 'OTP kadaluarsa' });
 }

 // Bersihkan OTP dan kirim password lama
 // const oldPassword = user.password;

 if (user.otp.change == "emailVerified") {
  user.isEmailVerified = true;
 }

 user.otp = undefined;
 await user.save();

 res.json({ code: 200, message: "ok" });
});

module.exports = router;