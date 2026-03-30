require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, '../frontend/public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api', require('./routes/misc'));

// Serve frontend pages
const pagesDir = path.join(__dirname, '../frontend/pages');

app.get('/', (req, res) => res.sendFile(path.join(pagesDir, 'index.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(pagesDir, 'shop.html')));
app.get('/product/:slug', (req, res) => res.sendFile(path.join(pagesDir, 'product.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(pagesDir, 'cart.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(pagesDir, 'checkout.html')));
app.get('/login', (req, res) => res.sendFile(path.join(pagesDir, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(pagesDir, 'register.html')));
app.get('/order-success', (req, res) => res.sendFile(path.join(pagesDir, 'order-success.html')));
app.get('/track', (req, res) => res.sendFile(path.join(pagesDir, 'track.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(pagesDir, 'user/profile.html')));
app.get('/my-orders', (req, res) => res.sendFile(path.join(pagesDir, 'user/orders.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(pagesDir, 'admin/dashboard.html')));
app.get('/admin/products', (req, res) => res.sendFile(path.join(pagesDir, 'admin/products.html')));
app.get('/admin/orders', (req, res) => res.sendFile(path.join(pagesDir, 'admin/orders.html')));
app.get('/admin/categories', (req, res) => res.sendFile(path.join(pagesDir, 'admin/categories.html')));
app.get('/admin/coupons', (req, res) => res.sendFile(path.join(pagesDir, 'admin/coupons.html')));
app.get('/admin/users', (req, res) => res.sendFile(path.join(pagesDir, 'admin/users.html')));

// Health check for Railway
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
