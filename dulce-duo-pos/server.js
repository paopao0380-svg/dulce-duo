/**
 * Dulce Dúo POS - Servidor
 * Sirve el frontend y la API para que todos los dispositivos compartan los mismos datos.
 */
const express = require('express');
const path = require('path');
const cors = require('cors');
const store = require('./db/store');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'Dulce Dúo POS', time: new Date().toISOString() });
});

app.get('/api/bootstrap', (req, res) => {
  const data = store.read();
  res.json({
    products: data.products,
    categories: data.categories,
    settings: data.settings,
    sales: data.sales,
    expenses: data.expenses
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const data = store.read();
  const user = data.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

  data.access_log.push({
    id: store.genId(),
    user_id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    action: 'ingreso',
    at: new Date().toISOString()
  });
  data.access_log = data.access_log.slice(-500);
  store.write(data);

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name
  });
});

app.post('/api/logout', (req, res) => {
  const { id, username, name, role } = req.body || {};
  if (id || username) {
    const data = store.read();
    data.access_log.push({
      id: store.genId(),
      user_id: id,
      username,
      name,
      role,
      action: 'salida',
      at: new Date().toISOString()
    });
    data.access_log = data.access_log.slice(-500);
    store.write(data);
  }
  res.json({ ok: true });
});

app.get('/api/users', (req, res) => {
  res.json(store.read().users);
});

app.put('/api/users/:id', (req, res) => {
  const data = store.read();
  const idx = data.users.findIndex(u => u.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { name, username, password } = req.body || {};
  if (username) {
    const exists = data.users.find(u => u.username === username && u.id !== req.params.id);
    if (exists) return res.status(400).json({ error: 'Ese nombre de usuario ya existe' });
    data.users[idx].username = String(username).trim();
  }
  if (name) data.users[idx].name = String(name).trim();
  if (password && String(password).length >= 4) data.users[idx].password = String(password);
  store.write(data);
  res.json(data.users[idx]);
});

app.get('/api/products', (req, res) => {
  res.json(store.read().products);
});

app.post('/api/products', (req, res) => {
  const data = store.read();
  const p = { ...req.body, id: req.body.id || Date.now() };
  data.products.push(p);
  store.write(data);
  res.json(p);
});

app.put('/api/products/:id', (req, res) => {
  const data = store.read();
  const idx = data.products.findIndex(p => String(p.id) === String(req.params.id));
  if (idx < 0) return res.status(404).json({ error: 'Producto no encontrado' });
  data.products[idx] = { ...data.products[idx], ...req.body, id: data.products[idx].id };
  store.write(data);
  res.json(data.products[idx]);
});

app.get('/api/categories', (req, res) => {
  res.json(store.read().categories);
});

app.get('/api/sales', (req, res) => {
  const sales = store.read().sales.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(sales);
});

app.post('/api/sales', (req, res) => {
  const data = store.read();
  const cart = req.body.cart || [];
  const orderType = req.body.order_type || 'Efectivo';
  const userId = req.body.user_id;

  const ticketNumber = data.settings.ticketPrefix + '-' + String(data.settings.nextTicket).padStart(4, '0');
  data.settings.nextTicket += 1;

  const subtotal = cart.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
  const sale = {
    id: store.genId(),
    ticket: ticketNumber,
    user_id: userId,
    order_type: orderType,
    items: cart.map(i => ({
      product_id: i.id,
      name: i.name,
      emoji: i.emoji,
      qty: i.qty,
      unit_price: i.price,
      subtotal: Number(i.price) * Number(i.qty)
    })),
    subtotal,
    tax: 0,
    total: subtotal,
    created_at: new Date().toISOString()
  };

  cart.forEach(item => {
    const p = data.products.find(x => String(x.id) === String(item.id));
    if (p) p.stock = Math.max(0, (p.stock || 0) - Number(item.qty));
  });

  data.sales.push(sale);
  store.write(data);
  res.json(sale);
});

app.get('/api/expenses', (req, res) => {
  const expenses = store.read().expenses.slice().sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
  res.json(expenses);
});

app.post('/api/expenses', (req, res) => {
  const data = store.read();
  const exp = Object.assign({ id: store.genId(), created_at: new Date().toISOString() }, req.body);
  data.expenses.push(exp);
  store.write(data);
  res.json(exp);
});

app.get('/api/access-log', (req, res) => {
  const logs = store.read().access_log.slice().reverse().slice(0, 100);
  res.json(logs);
});

app.get('/api/backup', (req, res) => {
  const data = store.read();
  res.json({
    version: 1,
    exported_at: new Date().toISOString(),
    app: 'Dulce Duo POS',
    data: data
  });
});

app.post('/api/backup/restore', (req, res) => {
  const payload = req.body;
  if (!payload || !payload.data) return res.status(400).json({ error: 'Respaldo inválido' });
  const current = store.read();
  const incoming = payload.data;
  store.write({
    users: incoming.users || current.users,
    categories: incoming.categories || current.categories,
    products: incoming.products || current.products,
    sales: incoming.sales || current.sales,
    expenses: incoming.expenses || current.expenses,
    access_log: incoming.access_log || current.access_log,
    settings: incoming.settings || current.settings
  });
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('Dulce Duo POS en puerto ' + PORT);
});
