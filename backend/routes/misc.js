const router = require('express').Router();
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

// ── CATEGORIES ──
router.get('/categories', async (req, res) => {
  // Ensure sort_order column exists (migration safe)
  try { await db.query('ALTER TABLE categories ADD COLUMN sort_order INT DEFAULT 0'); } catch {}
  const [rows] = await db.query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
  res.json(rows);
});

router.post('/categories', auth, adminOnly, async (req, res) => {
  try {
    const { name, image } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const [[{ maxOrder }]] = await db.query('SELECT COALESCE(MAX(sort_order),0) as maxOrder FROM categories');
    await db.query('INSERT INTO categories (name, slug, image, sort_order) VALUES (?,?,?,?)', [name, slug, image, maxOrder + 1]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reorder — reçoit un tableau d'IDs dans le nouvel ordre
// IMPORTANT: doit être avant /:id sinon Express capte "reorder" comme un id
router.put('/categories/reorder', auth, adminOnly, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids requis' });
    await Promise.all(ids.map((id, index) =>
      db.query('UPDATE categories SET sort_order=? WHERE id=?', [index, id])
    ));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/categories/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, image } = req.body;
    await db.query('UPDATE categories SET name=?, image=? WHERE id=?', [name, image, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/categories/:id', auth, adminOnly, async (req, res) => {
  await db.query('DELETE FROM categories WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// ── COUPONS ──
router.get('/coupons', auth, adminOnly, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/coupons', auth, adminOnly, async (req, res) => {
  try {
    const { code, type, value, min_amount, max_uses, expires_at } = req.body;
    await db.query(
      'INSERT INTO coupons (code, type, value, min_amount, max_uses, expires_at) VALUES (?,?,?,?,?,?)',
      [code.toUpperCase(), type, value, min_amount || 0, max_uses || null, expires_at || null]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/coupons/:id', auth, adminOnly, async (req, res) => {
  try {
    const { is_active } = req.body;
    await db.query('UPDATE coupons SET is_active=? WHERE id=?', [is_active ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/coupons/:id', auth, adminOnly, async (req, res) => {
  await db.query('DELETE FROM coupons WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// ── ADMIN STATS ──
router.get('/admin/stats', auth, adminOnly, async (req, res) => {
  try {
    const [[orders]] = await db.query('SELECT COUNT(*) as total, SUM(total) as revenue FROM orders WHERE status != "cancelled"');
    const [[pending]] = await db.query('SELECT COUNT(*) as total FROM orders WHERE status="pending"');
    const [[shipped]] = await db.query('SELECT COUNT(*) as total FROM orders WHERE status="shipped"');
    const [[users]] = await db.query('SELECT COUNT(*) as total FROM users WHERE role="user"');
    const [[products]] = await db.query('SELECT COUNT(*) as total FROM products WHERE is_active=1');
    const [recentOrders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
    const [topProducts] = await db.query(
      `SELECT p.name, p.image, SUM(oi.quantity) as sold FROM order_items oi
       JOIN products p ON oi.product_id = p.id GROUP BY p.id ORDER BY sold DESC LIMIT 5`
    );
    res.json({ orders: orders.total, revenue: orders.revenue || 0, pending: pending.total, shipped: shipped.total, users: users.total, products: products.total, recentOrders, topProducts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── USERS (admin) ──
router.get('/admin/users', auth, adminOnly, async (req, res) => {
  const [rows] = await db.query('SELECT id, name, email, role, phone, city, created_at FROM users ORDER BY created_at DESC');
  res.json(rows);
});

module.exports = router;
