-- =============================================
-- SCHEMA MySQL - Boutique Accessoires
-- Compatible Railway MySQL
-- =============================================

CREATE DATABASE IF NOT EXISTS railway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE railway;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  category_id INT,
  image VARCHAR(255),
  images JSON,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('percent', 'fixed') DEFAULT 'percent',
  value DECIMAL(10,2) NOT NULL,
  min_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INT DEFAULT NULL,
  uses_count INT DEFAULT 0,
  expires_at DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INT,
  guest_name VARCHAR(100),
  guest_email VARCHAR(150),
  guest_phone VARCHAR(20),
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_notes TEXT,
  coupon_id INT,
  coupon_code VARCHAR(50),
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('pending','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  payment_method ENUM('cash_on_delivery') DEFAULT 'cash_on_delivery',
  delivery_date DATE,
  delivery_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(200) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  selected_color VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Product Colors
CREATE TABLE IF NOT EXISTS product_colors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  hex VARCHAR(7) NOT NULL,
  stock INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =============================================
-- SEED DATA
-- =============================================

-- Admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@shop.ma', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Categories
INSERT INTO categories (name, slug, image) VALUES
('Sacs & Maroquinerie', 'sacs', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400'),
('Bijoux & Montres', 'bijoux', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'),
('Lunettes', 'lunettes', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400'),
('Ceintures', 'ceintures', 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400'),
('Foulards & Écharpes', 'foulards', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400');

-- Products
INSERT INTO products (name, slug, description, price, stock, category_id, image, is_featured) VALUES
('Sac à Main Élégant Noir', 'sac-main-elegant-noir', 'Sac en cuir véritable, spacieux et raffiné. Parfait pour toutes occasions.', 450.00, 25, 1, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600', TRUE),
('Sac Bandoulière Camel', 'sac-bandouliere-camel', 'Sac bandoulière tendance en similicuir premium. Plusieurs compartiments.', 320.00, 30, 1, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', TRUE),
('Montre Dorée Élégante', 'montre-doree-elegante', 'Montre femme dorée avec bracelet en métal. Mécanisme précis.', 680.00, 15, 2, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', TRUE),
('Collier Perles Naturelles', 'collier-perles-naturelles', 'Collier en perles naturelles avec fermoir doré. Longueur réglable.', 280.00, 40, 2, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', FALSE),
('Lunettes Aviateur Doré', 'lunettes-aviateur-dore', 'Lunettes de soleil style aviateur avec verres polarisés. Protection UV400.', 195.00, 50, 3, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600', TRUE),
('Lunettes Cat Eye Noires', 'lunettes-cat-eye-noires', 'Lunettes tendance cat eye en acétate premium. Style intemporel.', 220.00, 35, 3, 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=600', FALSE),
('Ceinture Cuir Marron', 'ceinture-cuir-marron', 'Ceinture en cuir véritable avec boucle argentée. Taille universelle.', 150.00, 60, 4, 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600', FALSE),
('Foulard Soie Fleuri', 'foulard-soie-fleuri', 'Foulard en soie naturelle avec motifs floraux colorés. 90x90cm.', 180.00, 45, 5, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600', TRUE);

-- Coupons
INSERT INTO coupons (code, type, value, min_amount, max_uses, expires_at) VALUES
('BIENVENUE10', 'percent', 10, 200, 100, '2025-12-31'),
('SOLDES20', 'percent', 20, 500, 50, '2025-06-30'),
('LIVRAISON50', 'fixed', 50, 300, 200, '2025-12-31');
