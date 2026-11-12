/**
 * Dulce Dúo POS - Capa de datos (localStorage)
 * Persistencia local para inventario, ventas, gastos y usuarios.
 * Ideal para uso en un solo equipo o como MVP antes de migrar a backend.
 */

const DB_KEYS = {
  USERS: 'dulce_users',
  PRODUCTS: 'dulce_products',
  CATEGORIES: 'dulce_categories',
  SALES: 'dulce_sales',
  EXPENSES: 'dulce_expenses',
  SETTINGS: 'dulce_settings',
  CURRENT_USER: 'dulce_current_user'
};

// ==================== UTILIDADES ====================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function formatMoney(n) {
  return '$' + (Number(n) || 0).toFixed(2);
}

function load(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error('Error loading', key, e);
    return defaultValue;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ==================== INICIALIZACIÓN ====================
function initDB() {
  // Usuarios por defecto
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    const defaultUsers = [
      {
        id: 'u1',
        username: 'cajera',
        password: 'cajera123', // En producción hashear
        role: 'cajera',
        name: 'Cajera Principal'
      },
      {
        id: 'u2',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Administrador'
      }
    ];
    save(DB_KEYS.USERS, defaultUsers);
  }

  // Categorías por defecto (basadas en el modelo)
  if (!localStorage.getItem(DB_KEYS.CATEGORIES)) {
    const cats = [
      { id: 'frappes', name: 'Frappés', icon: '🥤', description: 'Cremosos, helados y coronados con crema batida' },
      { id: 'helados', name: 'Helados Clásicos', icon: '🍦', description: 'Conos crujientes, copas y sabores artesanales' },
      { id: 'waffles', name: 'Waffles', icon: '🧇', description: 'Doraditos por fuera, esponjosos con helado y frutas' },
      { id: 'antojitos', name: 'Antojitos y Dulces', icon: '🍰', description: 'Postres irresistibles, crepas, brownies y más' },
      { id: 'batidos', name: 'Batidos Naturales', icon: '🍓', description: 'Fruta fresca seleccionada batida al instante' },
      { id: 'tostadas-cafe', name: 'Tostadas y Café', icon: '☕', description: 'Café pasado aromático y tostadas crujientes' }
    ];
    save(DB_KEYS.CATEGORIES, cats);
  }

  // Productos de ejemplo
  if (!localStorage.getItem(DB_KEYS.PRODUCTS)) {
    const products = [
      { id: 101, category: 'frappes', name: 'Frappé Dulce Dúo Fresa', desc: 'Fresa natural, helado de vainilla, crema chantilly y cereza.', price: 4.50, stock: 50, min_stock: 10, emoji: '🥤', popular: true, active: true },
      { id: 102, category: 'frappes', name: 'Frappé Mocha Caramelo', desc: 'Espresso intenso, chocolate, salsa de caramelo y crema.', price: 4.75, stock: 40, min_stock: 8, emoji: '🧋', popular: false, active: true },
      { id: 103, category: 'frappes', name: 'Frappé Oreo Tentación', desc: 'Galletas Oreo trituradas con base cremosa de leche y sirope.', price: 4.80, stock: 35, min_stock: 8, emoji: '🍪', popular: true, active: true },
      { id: 201, category: 'helados', name: 'Cono Dúo Corazón', desc: 'Dos bolas artesanales (Fresa y Vainilla) en cono galleta.', price: 3.25, stock: 80, min_stock: 15, emoji: '🍦', popular: true, active: true },
      { id: 202, category: 'helados', name: 'Copa Banana Split', desc: 'Tres sabores de helado, banano fresco, crema y nueces.', price: 5.50, stock: 30, min_stock: 5, emoji: '🍨', popular: false, active: true },
      { id: 203, category: 'helados', name: 'Tulipa Suprema de Frutos Rojos', desc: 'Canasta de barquillo con helado y coulis tibio de mora.', price: 4.90, stock: 25, min_stock: 5, emoji: '🍧', popular: false, active: true },
      { id: 301, category: 'waffles', name: 'Waffle Amor de Fresa', desc: 'Waffle belga, fresas frescas, bola de helado y leche condensada.', price: 5.75, stock: 40, min_stock: 8, emoji: '🧇', popular: true, active: true },
      { id: 302, category: 'waffles', name: 'Waffle Choco-Avellana', desc: 'Bañado en crema de avellanas, banano caramelizado y helado.', price: 6.00, stock: 35, min_stock: 8, emoji: '🍫', popular: false, active: true },
      { id: 303, category: 'waffles', name: 'Mini Waffles Dúo (6 uds)', desc: 'Ideales para compartir con miel de maple y frutas picadas.', price: 4.50, stock: 20, min_stock: 5, emoji: '🍯', popular: false, active: true },
      { id: 401, category: 'antojitos', name: 'Brownie Tibio con Helado', desc: 'Brownie de chocolate oscuro coronado con helado de vainilla.', price: 4.60, stock: 25, min_stock: 5, emoji: '🍫', popular: true, active: true },
      { id: 402, category: 'antojitos', name: 'Fresas con Crema Especial', desc: 'Fresas seleccionadas con nuestra crema dulce secreta de la casa.', price: 3.75, stock: 40, min_stock: 10, emoji: '🍓', popular: true, active: true },
      { id: 403, category: 'antojitos', name: 'Cheesecake de Maracuyá', desc: 'Porción cremosa con base de galleta dorada y glaseado tropical.', price: 4.25, stock: 18, min_stock: 5, emoji: '🍰', popular: false, active: true },
      { id: 501, category: 'batidos', name: 'Batido Cremoso de Mora y Fresa', desc: '100% fruta natural en leche o agua, refrescante y nutritivo.', price: 3.00, stock: 50, min_stock: 10, emoji: '🍓', popular: true, active: true },
      { id: 502, category: 'batidos', name: 'Batido Tropical Mango-Maracuyá', desc: 'Pulpa natural de mango dulce con toque ácido de maracuyá.', price: 3.25, stock: 45, min_stock: 10, emoji: '🥭', popular: false, active: true },
      { id: 503, category: 'batidos', name: 'Batido Energético Guanábana', desc: 'Pulpa pura de guanábana batida con leche fría.', price: 3.25, stock: 30, min_stock: 8, emoji: '🥤', popular: false, active: true },
      { id: 601, category: 'tostadas-cafe', name: 'Combo Tostada Mixta + Café', desc: 'Tostada crocante de jamón y queso + taza de café pasado.', price: 3.90, stock: 60, min_stock: 10, emoji: '🥪', popular: true, active: true },
      { id: 602, category: 'tostadas-cafe', name: 'Cappuccino Cremoso Dúo', desc: 'Café arábigo de altura con espuma sedosa y toque de canela.', price: 2.75, stock: 100, min_stock: 15, emoji: '☕', popular: true, active: true },
      { id: 603, category: 'tostadas-cafe', name: 'Tostadas Francesas con Miel', desc: 'Pan brioche dorado con mantequilla, canela y miel de abeja.', price: 4.10, stock: 25, min_stock: 5, emoji: '🍞', popular: false, active: true }
    ];
    save(DB_KEYS.PRODUCTS, products);
  }

  if (!localStorage.getItem(DB_KEYS.SALES)) save(DB_KEYS.SALES, []);
  if (!localStorage.getItem(DB_KEYS.EXPENSES)) save(DB_KEYS.EXPENSES, []);
  if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
    save(DB_KEYS.SETTINGS, {
      businessName: 'Dulce Dúo',
      slogan: 'Heladería y algo más',
      ivaRate: 0.15,
      ticketPrefix: 'DD',
      nextTicket: 1
    });
  }
}

// ==================== AUTH ====================
function login(username, password) {
  const users = load(DB_KEYS.USERS);
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const session = { id: user.id, username: user.username, role: user.role, name: user.name };
    localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(session));
    return session;
  }
  return null;
}

function logout() {
  localStorage.removeItem(DB_KEYS.CURRENT_USER);
}

function getCurrentUser() {
  return load(DB_KEYS.CURRENT_USER, null);
}

function requireAuth(role = null) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  if (role && user.role !== role && user.role !== 'admin') {
    alert('No tienes permiso para acceder a esta sección.');
    window.location.href = user.role === 'cajera' ? 'pos.html' : 'index.html';
    return null;
  }
  return user;
}

// ==================== PRODUCTOS ====================
function getProducts(onlyActive = true) {
  let products = load(DB_KEYS.PRODUCTS);
  if (onlyActive) products = products.filter(p => p.active !== false);
  return products;
}

function getProductById(id) {
  return getProducts(false).find(p => p.id == id);
}

function saveProduct(product) {
  const products = load(DB_KEYS.PRODUCTS);
  const idx = products.findIndex(p => p.id == product.id);
  if (idx >= 0) {
    products[idx] = { ...products[idx], ...product };
  } else {
    product.id = product.id || Date.now();
    products.push(product);
  }
  save(DB_KEYS.PRODUCTS, products);
  return product;
}

function updateStock(productId, delta) {
  const products = load(DB_KEYS.PRODUCTS);
  const p = products.find(x => x.id == productId);
  if (p) {
    p.stock = Math.max(0, (p.stock || 0) + delta);
    save(DB_KEYS.PRODUCTS, products);
  }
}

function getLowStockProducts() {
  return getProducts(false).filter(p => p.active !== false && (p.stock || 0) <= (p.min_stock || 5));
}

// ==================== CATEGORÍAS ====================
function getCategories() {
  return load(DB_KEYS.CATEGORIES);
}

// ==================== VENTAS ====================
function getSales() {
  return load(DB_KEYS.SALES).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function createSale(cart, orderType, userId) {
  const settings = load(DB_KEYS.SETTINGS);
  const ticketNumber = `${settings.ticketPrefix}-${String(settings.nextTicket).padStart(4, '0')}`;
  settings.nextTicket += 1;
  save(DB_KEYS.SETTINGS, settings);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * (settings.ivaRate || 0.15);
  const total = subtotal + tax;

  const sale = {
    id: generateId(),
    ticket: ticketNumber,
    user_id: userId,
    order_type: orderType,
    items: cart.map(i => ({
      product_id: i.id,
      name: i.name,
      emoji: i.emoji,
      qty: i.qty,
      unit_price: i.price,
      subtotal: i.price * i.qty
    })),
    subtotal,
    tax,
    total,
    created_at: new Date().toISOString()
  };

  // Descontar stock
  cart.forEach(item => updateStock(item.id, -item.qty));

  const sales = load(DB_KEYS.SALES);
  sales.push(sale);
  save(DB_KEYS.SALES, sales);
  return sale;
}

function getSalesByDateRange(from, to) {
  const sales = getSales();
  return sales.filter(s => {
    const d = s.created_at.split('T')[0];
    return d >= from && d <= to;
  });
}

function getTodaySales() {
  const today = getToday();
  return getSalesByDateRange(today, today);
}

// ==================== GASTOS ====================
function getExpenses() {
  return load(DB_KEYS.EXPENSES).sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
}

function addExpense(expense) {
  const exp = {
    id: generateId(),
    ...expense,
    created_at: new Date().toISOString()
  };
  const expenses = load(DB_KEYS.EXPENSES);
  expenses.push(exp);
  save(DB_KEYS.EXPENSES, expenses);
  return exp;
}

function getExpensesByDateRange(from, to) {
  return getExpenses().filter(e => {
    const d = (e.date || e.created_at || '').split('T')[0];
    return d >= from && d <= to;
  });
}

function getTodayExpenses() {
  const today = getToday();
  return getExpensesByDateRange(today, today);
}

// ==================== REPORTES / STATS ====================
function getDashboardStats() {
  const todaySales = getTodaySales();
  const todayExpenses = getTodayExpenses();
  const ingresos = todaySales.reduce((s, x) => s + x.total, 0);
  const egresos = todayExpenses.reduce((s, x) => s + (x.total || 0), 0);
  return {
    ventasHoy: ingresos,
    pedidosHoy: todaySales.length,
    gastosHoy: egresos,
    utilidadHoy: ingresos - egresos,
    lowStock: getLowStockProducts(),
    topProducts: getTopProducts(5),
    latestSales: getSales().slice(0, 8),
    latestExpenses: getExpenses().slice(0, 8)
  };
}

function getTopProducts(limit = 5) {
  const sales = getSales();
  const counts = {};
  sales.forEach(s => {
    s.items.forEach(i => {
      counts[i.product_id] = (counts[i.product_id] || 0) + i.qty;
    });
  });
  return Object.entries(counts)
    .map(([id, qty]) => {
      const p = getProductById(id);
      return { id, name: p ? p.name : 'Producto', emoji: p ? p.emoji : '📦', qty };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

// Inicializar al cargar
initDB();
