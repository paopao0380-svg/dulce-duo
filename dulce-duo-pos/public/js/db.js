/**
 * Dulce Dúo POS - Cliente de datos
 * Usa la API del servidor para que PC y celular compartan la misma información.
 * Mantiene caché en memoria para lecturas rápidas.
 */

const API = ''; // mismo origen

let cache = {
  products: [],
  categories: [],
  sales: [],
  expenses: [],
  users: [],
  settings: { ticketPrefix: 'DD', nextTicket: 1, ivaRate: 0 },
  access_log: [],
  ready: false
};

const SESSION_KEY = 'dulce_current_user';

function formatMoney(n) {
  return '$' + (Number(n) || 0).toFixed(2);
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    let msg = 'Error de servidor';
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function initDB() {
  try {
    const data = await api('/api/bootstrap');
    cache.products = data.products || [];
    cache.categories = data.categories || [];
    cache.sales = data.sales || [];
    cache.expenses = data.expenses || [];
    cache.settings = data.settings || cache.settings;
    cache.ready = true;
  } catch (e) {
    console.error('No se pudo conectar con el servidor', e);
    cache.ready = false;
    throw e;
  }
}

// ---------- Auth ----------
async function login(username, password) {
  const session = await api('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

async function logout() {
  const user = getCurrentUser();
  if (user) {
    try {
      await api('/api/logout', { method: 'POST', body: JSON.stringify(user) });
    } catch (_) {}
  }
  localStorage.removeItem(SESSION_KEY);
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function requireAuth(role = null) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role) && user.role !== 'admin') {
      alert('No tienes permiso para acceder a esta sección.');
      if (user.role === 'cajera') window.location.href = 'pos.html';
      else if (user.role === 'contador') window.location.href = 'admin.html';
      else window.location.href = 'index.html';
      return null;
    }
  }
  return user;
}

// ---------- Lecturas (caché) ----------
function getProducts(onlyActive = true) {
  let products = cache.products || [];
  if (onlyActive) products = products.filter(p => p.active !== false);
  return products;
}

function getProductById(id) {
  return (cache.products || []).find(p => String(p.id) === String(id));
}

function getCategories() {
  return cache.categories || [];
}

function getSales() {
  return (cache.sales || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getExpenses() {
  return (cache.expenses || []).slice().sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
}

function getSalesByDateRange(from, to) {
  return getSales().filter(s => {
    const d = s.created_at.split('T')[0];
    return d >= from && d <= to;
  });
}

function getExpensesByDateRange(from, to) {
  return getExpenses().filter(e => {
    const d = (e.date || e.created_at || '').split('T')[0];
    return d >= from && d <= to;
  });
}

function getTodaySales() {
  const t = getToday();
  return getSalesByDateRange(t, t);
}

function getTodayExpenses() {
  const t = getToday();
  return getExpensesByDateRange(t, t);
}

function getLowStockProducts() {
  return getProducts(false).filter(p => p.active !== false && (p.stock || 0) <= (p.min_stock || 5));
}

function getTopProducts(limit = 5) {
  const counts = {};
  getSales().forEach(s => {
    (s.items || []).forEach(i => {
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

// ---------- Escrituras (API + caché) ----------
async function createSale(cart, orderType, userId) {
  const sale = await api('/api/sales', {
    method: 'POST',
    body: JSON.stringify({ cart, order_type: orderType, user_id: userId })
  });
  cache.sales.push(sale);
  // refrescar stock local
  cart.forEach(item => {
    const p = cache.products.find(x => String(x.id) === String(item.id));
    if (p) p.stock = Math.max(0, (p.stock || 0) - Number(item.qty));
  });
  return sale;
}

async function saveProduct(product) {
  const existing = cache.products.find(p => String(p.id) === String(product.id));
  let saved;
  if (existing) {
    saved = await api('/api/products/' + product.id, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
    const idx = cache.products.findIndex(p => String(p.id) === String(product.id));
    cache.products[idx] = saved;
  } else {
    saved = await api('/api/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    cache.products.push(saved);
  }
  return saved;
}

async function addExpense(expense) {
  const exp = await api('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(expense)
  });
  cache.expenses.push(exp);
  return exp;
}

async function getUsers() {
  const users = await api('/api/users');
  cache.users = users;
  return users;
}

async function updateUser(userId, data) {
  const updated = await api('/api/users/' + userId, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return updated;
}

async function getAccessLogs(limit = 80) {
  const logs = await api('/api/access-log');
  cache.access_log = logs;
  return logs.slice(0, limit);
}

async function downloadBackup() {
  const payload = await api('/api/backup');
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'DulceDuo_Respaldo_' + getToday() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return payload;
}

async function importFullBackup(payload) {
  await api('/api/backup/restore', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  await initDB();
  return true;
}

// Compat: init síncrono no aplica; las páginas deben await initDB()
// Export helpers usados por HTML
window.initDB = initDB;
window.login = login;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.formatMoney = formatMoney;
window.getToday = getToday;
window.getProducts = getProducts;
window.getProductById = getProductById;
window.getCategories = getCategories;
window.getSales = getSales;
window.getExpenses = getExpenses;
window.getSalesByDateRange = getSalesByDateRange;
window.getExpensesByDateRange = getExpensesByDateRange;
window.getTodaySales = getTodaySales;
window.getTodayExpenses = getTodayExpenses;
window.getDashboardStats = getDashboardStats;
window.getLowStockProducts = getLowStockProducts;
window.getTopProducts = getTopProducts;
window.createSale = createSale;
window.saveProduct = saveProduct;
window.addExpense = addExpense;
window.getUsers = getUsers;
window.updateUser = updateUser;
window.getAccessLogs = getAccessLogs;
window.downloadBackup = downloadBackup;

async function seedFullCatalog() {
  const result = await api('/api/products/seed-catalog', { method: 'POST', body: '{}' });
  cache.products = result.products || [];
  return result;
}

window.importFullBackup = importFullBackup;
window.seedFullCatalog = seedFullCatalog;
