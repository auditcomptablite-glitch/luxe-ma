require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Trust proxy (Cloudflare + Railway) ──────────────────────────────────────
// Nécessaire pour que req.ip soit l'IP réelle du visiteur (pas Cloudflare)
// et pour que les cookies secure fonctionnent derrière HTTPS.
app.set('trust proxy', 1);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Fichiers statiques avec cache long pour Cloudflare ───────────────────────
// Cloudflare met en cache CSS/JS/images selon Cache-Control.
// max-age=31536000 (1 an) + immutable = Cloudflare ne re-télécharge jamais ces fichiers.
// Le navigateur recharge si le nom du fichier change (cache-busting).
app.use(express.static(path.join(__dirname, '../frontend/public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
  immutable: process.env.NODE_ENV === 'production',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Images : cache 1 an
    if (/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // CSS / JS : cache 1 an
    else if (/\.(css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Fonts : cache 1 an
    else if (/\.(woff|woff2|ttf|eot)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// ── API Routes ───────────────────────────────────────────────────────────────
// Les réponses API ne sont jamais mises en cache par Cloudflare (no-store).
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api', require('./routes/misc'));

// ── Pages HTML ───────────────────────────────────────────────────────────────
// Cache court sur les pages HTML (5 min) — Cloudflare peut les servir
// mais elles se rafraîchissent régulièrement.
const pagesDir = path.join(__dirname, '../frontend/pages');
const sendPage = (file) => (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.sendFile(path.join(pagesDir, file));
};

app.get('/',                  sendPage('index.html'));
app.get('/shop',              sendPage('shop.html'));
app.get('/product/:slug',     sendPage('product.html'));
app.get('/cart',              sendPage('cart.html'));
app.get('/checkout',          sendPage('checkout.html'));
app.get('/login',             sendPage('login.html'));
app.get('/register',          sendPage('register.html'));
app.get('/order-success',     sendPage('order-success.html'));
app.get('/track',             sendPage('track.html'));
app.get('/profile',           sendPage('user/profile.html'));
app.get('/my-orders',         sendPage('user/orders.html'));
app.get('/admin',             sendPage('admin/dashboard.html'));
app.get('/admin/products',    sendPage('admin/products.html'));
app.get('/admin/orders',      sendPage('admin/orders.html'));
app.get('/admin/categories',  sendPage('admin/categories.html'));
app.get('/admin/coupons',     sendPage('admin/coupons.html'));
app.get('/admin/users',       sendPage('admin/users.html'));

// ── Health check Railway ─────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    worker: process.env.pm_id || '0',
    uptime: Math.floor(process.uptime())
  });
});

app.listen(PORT, () => {
  const workerId = process.env.pm_id || '0';
  console.log(`✅ Worker #${workerId} — port ${PORT}`);
});
