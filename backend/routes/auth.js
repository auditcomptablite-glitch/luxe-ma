const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { auth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_shop_key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, city } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Champs requis manquants' });

    const [existing] = await db.query('SELECT id FROM users WHERE email=?', [email]);
    if (existing.length) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, address, city) VALUES (?,?,?,?,?,?)',
      [name, email, hash, phone || null, address || null, city || null]
    );

    const token = jwt.sign({ id: result.insertId, name, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
    res.json({ success: true, user: { id: result.insertId, name, email, role: 'user' }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (!rows.length) return res.status(400).json({ error: 'Email ou mot de passe incorrect' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Email ou mot de passe incorrect' });

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Me
router.get('/me', auth, async (req, res) => {
  const [rows] = await db.query('SELECT id, name, email, role, phone, address, city, created_at FROM users WHERE id=?', [req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json(rows[0]);
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address, city } = req.body;
    await db.query('UPDATE users SET name=?, phone=?, address=?, city=? WHERE id=?', [name, phone, address, city, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
