const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
 const ignoreFailure = req.body?.ignoreFailure;
 const token = req.header('Authorization')?.replace('Bearer ', '');

 if (!token) return res.status(401).json({ error: 'No token' });

 try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findOne({ _id: decoded.id });

  if (!user) return res.status(401).json({ error: 'User not found' });

  const tokenExists = user.sessionTokens.find(t => t.token === token);
  if (!tokenExists) return res.status(401).json({ error: 'Session expired' });

  req.user = user;
  req.token = token;
  req.userId = decoded.id;

  next();
 } catch (err) {
  if (ignoreFailure) {
   next();
  } else {
   res.status(200).json({ code: 401, error: 'Token invalid' });
  }
 }
};

module.exports = authMiddleware;
