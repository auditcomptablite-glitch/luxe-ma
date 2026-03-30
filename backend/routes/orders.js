const router = require('express').Router();
const db = require('../config/db');
const { auth, adminOnly, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Validate coupon
router.post('/validate-coupon', async (req, res) => {
  try {
    const { code, amount } = req.body;
    const [rows] = await db.query(
      `SELECT * FROM coupons WHERE code=? AND is_active=1 AND (expires_at IS NULL OR expires_at >= CURDATE()) AND (max_uses IS NULL OR uses_count < max_uses)`,
      [code]
    );
    if (!rows.length) return res.status(400).json({ error: 'Coupon invalide ou expiré' });
    const coupon = rows[0];
    if (amount < coupon.min_amount) return res.status(400).json({ error: `Montant minimum requis: ${coupon.min_amount} MAD` });

    let discount = coupon.type === 'percent' ? (amount * coupon.value / 100) : coupon.value;
    discount = Math.min(discount, amount);
    res.json({ valid: true, coupon, discount: parseFloat(discount.toFixed(2)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create order (public or logged in)
router.post('/', optionalAuth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { items, shipping, coupon_code } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'Panier vide' });

    // Validate items and calculate subtotal
    let subtotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const [rows] = await conn.query('SELECT * FROM products WHERE id=? AND is_active=1', [item.product_id]);
      if (!rows.length) throw new Error(`Produit #${item.product_id} introuvable`);
      const product = rows[0];
      if (product.stock < item.quantity) throw new Error(`Stock insuffisant pour ${product.name}`);
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      validatedItems.push({ ...item, product, itemSubtotal });
    }

    // Apply coupon
    let discount = 0, coupon_id = null;
    if (coupon_code) {
      const [crows] = await conn.query(
        `SELECT * FROM coupons WHERE code=? AND is_active=1 AND (expires_at IS NULL OR expires_at >= CURDATE()) AND (max_uses IS NULL OR uses_count < max_uses)`,
        [coupon_code]
      );
      if (crows.length && subtotal >= crows[0].min_amount) {
        const c = crows[0];
        coupon_id = c.id;
        discount = c.type === 'percent' ? (subtotal * c.value / 100) : c.value;
        discount = Math.min(discount, subtotal);
        await conn.query('UPDATE coupons SET uses_count = uses_count + 1 WHERE id=?', [c.id]);
      }
    }

    const total = subtotal - discount;
    const order_number = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_number, user_id, guest_name, guest_email, guest_phone, shipping_address, shipping_city, shipping_notes, coupon_id, coupon_code, subtotal, discount, total)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        order_number, req.user?.id || null,
        !req.user ? shipping.name : null, !req.user ? shipping.email : null, shipping.phone,
        shipping.address, shipping.city, shipping.notes || null,
        coupon_id, coupon_code || null, subtotal, discount, total
      ]
    );

    const order_id = orderResult.insertId;

    for (const item of validatedItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) VALUES (?,?,?,?,?,?)',
        [order_id, item.product_id, item.product.name, item.product.price, item.quantity, item.itemSubtotal]
      );
      await conn.query('UPDATE products SET stock = stock - ? WHERE id=?', [item.quantity, item.product_id]);
    }

    await conn.commit();
    res.json({ success: true, order_number, order_id, total });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Get user orders
router.get('/my', auth, async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
    for (const order of orders) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id=?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (admin)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status=?'; params.push(status); }
    const [countRows] = await db.query(query.replace('*', 'COUNT(*) as total'), params);
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (page - 1) * limit);
    const [orders] = await db.query(query, params);
    for (const order of orders) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id=?', [order.id]);
      order.items = items;
    }
    res.json({ orders, total: countRows[0].total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status (admin)
router.put('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status, delivery_date, delivery_notes } = req.body;
    await db.query('UPDATE orders SET status=?, delivery_date=?, delivery_notes=? WHERE id=?',
      [status, delivery_date || null, delivery_notes || null, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get order by number (public)
router.get('/track/:number', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders WHERE order_number=?', [req.params.number]);
    if (!rows.length) return res.status(404).json({ error: 'Commande non trouvée' });
    const order = rows[0];
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id=?', [order.id]);
    order.items = items;
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
