/**
 * Dulce Dúo POS - Servidor
 * Datos durables en Postgres (DATABASE_URL) para no perder ventas al actualizar.
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

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

app.get('/api/health', asyncHandler(async (req, res) => {
  await store.init();
  res.json({
    ok: true,
    app: 'Dulce Dúo POS',
    durable: store.isDurable(),
    time: new Date().toISOString()
  });
}));

app.get('/api/bootstrap', asyncHandler(async (req, res) => {
  const data = await store.read();
  res.json({
    products: data.products,
    categories: data.categories,
    settings: data.settings,
    sales: data.sales,
    expenses: data.expenses,
    durable: store.isDurable()
  });
}));

app.post('/api/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  const data = await store.read();
  const user = data.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

  data.access_log = data.access_log || [];
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
  await store.write(data);

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name
  });
}));

app.post('/api/logout', asyncHandler(async (req, res) => {
  const { id, username, name, role } = req.body || {};
  if (id || username) {
    const data = await store.read();
    data.access_log = data.access_log || [];
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
    await store.write(data);
  }
  res.json({ ok: true });
}));

app.get('/api/users', asyncHandler(async (req, res) => {
  const data = await store.read();
  res.json(data.users);
}));

app.put('/api/users/:id', asyncHandler(async (req, res) => {
  const data = await store.read();
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
  await store.write(data);
  res.json(data.users[idx]);
}));

app.get('/api/products', asyncHandler(async (req, res) => {
  const data = await store.read();
  res.json(data.products);
}));

app.post('/api/products', asyncHandler(async (req, res) => {
  const data = await store.read();
  const p = Object.assign({}, req.body, { id: req.body.id || Date.now() });
  data.products.push(p);
  await store.write(data);
  res.json(p);
}));

app.put('/api/products/:id', asyncHandler(async (req, res) => {
  const data = await store.read();
  const idx = data.products.findIndex(p => String(p.id) === String(req.params.id));
  if (idx < 0) return res.status(404).json({ error: 'Producto no encontrado' });
  data.products[idx] = Object.assign({}, data.products[idx], req.body, { id: data.products[idx].id });
  await store.write(data);
  res.json(data.products[idx]);
}));

app.post('/api/products/seed-catalog', asyncHandler(async (req, res) => {
  const data = await store.read();
  const full = store.getFullCatalog();
  let added = 0;
  let updated = 0;
  full.forEach(catalogItem => {
    const idx = data.products.findIndex(p => String(p.id) === String(catalogItem.id));
    if (idx < 0) {
      data.products.push(Object.assign({}, catalogItem));
      added++;
    } else {
      const currentStock = data.products[idx].stock;
      data.products[idx] = Object.assign({}, data.products[idx], {
        name: catalogItem.name,
        desc: catalogItem.desc,
        category: catalogItem.category,
        price: catalogItem.price,
        min_stock: catalogItem.min_stock,
        emoji: catalogItem.emoji,
        popular: catalogItem.popular,
        active: true
      });
      if (currentStock != null) data.products[idx].stock = currentStock;
      updated++;
    }
  });
  await store.write(data);
  res.json({ ok: true, added, updated, total: data.products.length, products: data.products });
}));

app.get('/api/categories', asyncHandler(async (req, res) => {
  const data = await store.read();
  res.json(data.categories);
}));

app.get('/api/sales', asyncHandler(async (req, res) => {
  const data = await store.read();
  const sales = (data.sales || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(sales);
}));

app.post('/api/sales', asyncHandler(async (req, res) => {
  const data = await store.read();
  const cart = req.body.cart || [];
  const orderType = req.body.order_type || 'Efectivo';
  const userId = req.body.user_id;

  if (!data.settings) data.settings = { ticketPrefix: 'DD', nextTicket: 1, ivaRate: 0 };
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

  data.sales = data.sales || [];
  data.sales.push(sale);
  await store.write(data);
  res.json(sale);
}));

app.get('/api/expenses', asyncHandler(async (req, res) => {
  const data = await store.read();
  const expenses = (data.expenses || []).slice().sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
  res.json(expenses);
}));

app.post('/api/expenses', asyncHandler(async (req, res) => {
  const data = await store.read();
  const exp = Object.assign({ id: store.genId(), created_at: new Date().toISOString() }, req.body);
  data.expenses = data.expenses || [];
  data.expenses.push(exp);
  await store.write(data);
  res.json(exp);
}));

app.get('/api/access-log', asyncHandler(async (req, res) => {
  const data = await store.read();
  const logs = (data.access_log || []).slice().reverse().slice(0, 100);
  res.json(logs);
}));

app.get('/api/backup', asyncHandler(async (req, res) => {
  const data = await store.read();
  res.json({
    version: 1,
    exported_at: new Date().toISOString(),
    app: 'Dulce Duo POS',
    data: data
  });
}));

app.post('/api/backup/restore', asyncHandler(async (req, res) => {
  const payload = req.body;
  if (!payload || !payload.data) return res.status(400).json({ error: 'Respaldo inválido' });
  const current = await store.read();
  const incoming = payload.data;
  await store.write({
    users: incoming.users || current.users,
    categories: incoming.categories || current.categories,
    products: incoming.products || current.products,
    sales: incoming.sales || current.sales,
    expenses: incoming.expenses || current.expenses,
    access_log: incoming.access_log || current.access_log,
    settings: incoming.settings || current.settings
  });
  res.json({ ok: true });
}));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno' });
});

store.init().then(() => {
  app.listen(PORT, () => {
    console.log('Dulce Duo POS en puerto ' + PORT);
    console.log('Almacenamiento durable: ' + (store.isDurable() ? 'SI (Postgres)' : 'NO (archivo local)'));
  });
}).catch(err => {
  console.error('No se pudo iniciar el almacén:', err);
  process.exit(1);
});
