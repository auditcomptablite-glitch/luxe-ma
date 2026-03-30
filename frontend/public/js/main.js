// ============================================================
//  LUXE ACCESSORIES — Shared Utilities
// ============================================================

const API = '/api';

// ── AUTH ──────────────────────────────────────────────────
const Auth = {
  get() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } },
  set(user, token) { localStorage.setItem('user', JSON.stringify(user)); if (token) localStorage.setItem('token', token); },
  token() { return localStorage.getItem('token'); },
  clear() { localStorage.removeItem('user'); localStorage.removeItem('token'); },
  isAdmin() { return this.get()?.role === 'admin'; },
  isLoggedIn() { return !!this.get(); }
};

// ── CART ──────────────────────────────────────────────────
const Cart = {
  get() { try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; } },
  save(items) { localStorage.setItem('cart', JSON.stringify(items)); Cart.updateBadge(); },
  add(product, qty = 1) {
    const items = Cart.get();
    const idx = items.findIndex(i => i.product_id === product.id);
    if (idx > -1) items[idx].quantity += qty;
    else items.push({ product_id: product.id, name: product.name, price: parseFloat(product.price), image: product.image, quantity: qty });
    Cart.save(items);
    Toast.success(`${product.name} ajouté au panier`);
  },
  remove(product_id) { Cart.save(Cart.get().filter(i => i.product_id !== product_id)); },
  updateQty(product_id, qty) {
    const items = Cart.get();
    const idx = items.findIndex(i => i.product_id === product_id);
    if (idx > -1) { items[idx].quantity = qty; if (qty <= 0) items.splice(idx, 1); }
    Cart.save(items);
  },
  clear() { localStorage.removeItem('cart'); Cart.updateBadge(); },
  count() { return Cart.get().reduce((s, i) => s + i.quantity, 0); },
  subtotal() { return Cart.get().reduce((s, i) => s + i.price * i.quantity, 0); },
  updateBadge() {
    const count = Cart.count();
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = count;
      el.style.display = count ? 'flex' : 'none';
    });
  }
};

// ── TOAST ─────────────────────────────────────────────────
const Toast = {
  show(msg, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span style="color:${type==='success'?'#5cb85c':type==='error'?'#e05555':'#c9a84c'};font-weight:600">${icons[type]}</span> ${msg}`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(() => t.remove(), 400); }, duration);
  },
  success(msg) { Toast.show(msg, 'success'); },
  error(msg) { Toast.show(msg, 'error'); },
  info(msg) { Toast.show(msg, 'info'); }
};

// ── API HELPER ────────────────────────────────────────────
async function apiCall(method, url, data = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };
  const token = Auth.token();
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(API + url, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erreur serveur');
  return json;
}

// ── FORMAT HELPERS ────────────────────────────────────────
function formatPrice(n) { return parseFloat(n || 0).toFixed(2) + ' MAD'; }
function formatDate(d) { return new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' }); }
function statusLabel(s) {
  const map = { pending: 'En attente', confirmed: 'Confirmée', processing: 'En préparation', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' };
  return map[s] || s;
}
function statusBadge(s) { return `<span class="badge badge-${s}">${statusLabel(s)}</span>`; }

// ── MODAL ─────────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
  if (e.target.classList.contains('modal-close')) e.target.closest('.modal-overlay')?.classList.remove('open');
});

// ── INIT NAV ──────────────────────────────────────────────
function initNav() {
  Cart.updateBadge();
  const user = Auth.get();
  const navUser = document.getElementById('nav-user');
  const navLogin = document.getElementById('nav-login');

  // Mobile menu elements
  const mobileLoginLink  = document.getElementById('mobile-login-link');
  const mobileLogoutBtn  = document.getElementById('mobile-logout-btn');
  const mobileProfileLink = document.getElementById('mobile-profile-link');
  const mobileOrdersLink = document.getElementById('mobile-orders-link');
  const mobileAdminLink  = document.getElementById('mobile-admin-link');

  if (user) {
    // Desktop
    if (navLogin) navLogin.style.display = 'none';
    if (navUser) {
      navUser.style.display = 'flex';
      const nameEl = navUser.querySelector('.nav-user-name');
      if (nameEl) nameEl.textContent = user.name;
      if (user.role === 'admin') {
        const adminLink = navUser.querySelector('.nav-admin-link');
        if (adminLink) adminLink.style.display = 'inline-flex';
      }
    }
    // Mobile
    if (mobileLoginLink)   mobileLoginLink.style.display = 'none';
    if (mobileLogoutBtn)   mobileLogoutBtn.style.display = 'block';
    if (mobileProfileLink) mobileProfileLink.style.display = 'block';
    if (mobileOrdersLink)  mobileOrdersLink.style.display = 'block';
    if (mobileAdminLink && user.role === 'admin') mobileAdminLink.style.display = 'block';
  } else {
    // Desktop
    if (navUser) navUser.style.display = 'none';
    if (navLogin) navLogin.style.display = 'flex';
    // Mobile
    if (mobileLoginLink)   mobileLoginLink.style.display = 'block';
    if (mobileLogoutBtn)   mobileLogoutBtn.style.display = 'none';
    if (mobileProfileLink) mobileProfileLink.style.display = 'none';
    if (mobileOrdersLink)  mobileOrdersLink.style.display = 'none';
    if (mobileAdminLink)   mobileAdminLink.style.display = 'none';
  }
}

async function logout() {
  try { await apiCall('POST', '/auth/logout'); } catch {}
  Auth.clear();
  window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', initNav);
