const router = require('express').Router();
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { category, search, featured, page = 1, limit = 12 } = req.query;
    let query = `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1`;
    const params = [];

    if (category) { query += ' AND c.slug = ?'; params.push(category); }
    if (search) { query += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (featured === 'true') { query += ' AND p.is_featured = 1'; }

    const offset = (page - 1) * limit;
    const [countRows] = await db.query(query.replace('p.*, c.name as category_name', 'COUNT(*) as total'), params);
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);
    res.json({ products: rows, total: countRows[0].total, page: parseInt(page), pages: Math.ceil(countRows[0].total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product
router.get('/:slug', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? AND p.is_active = 1',
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product (admin)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, price, stock, category_id, image, is_featured } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
    const [result] = await db.query(
      'INSERT INTO products (name, slug, description, price, stock, category_id, image, is_featured) VALUES (?,?,?,?,?,?,?,?)',
      [name, slug, description, price, stock || 0, category_id, image, is_featured ? 1 : 0]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product (admin)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, price, stock, category_id, image, is_featured, is_active } = req.body;
    await db.query(
      'UPDATE products SET name=?, description=?, price=?, stock=?, category_id=?, image=?, is_featured=?, is_active=? WHERE id=?',
      [name, description, price, stock, category_id, image, is_featured ? 1 : 0, is_active ? 1 : 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product (admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.query('UPDATE products SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
