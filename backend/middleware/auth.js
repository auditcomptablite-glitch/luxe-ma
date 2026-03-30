const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret_shop_key');
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  next();
};

const optionalAuth = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret_shop_key'); } catch {}
  }
  next();
};

module.exports = { auth, adminOnly, optionalAuth };
