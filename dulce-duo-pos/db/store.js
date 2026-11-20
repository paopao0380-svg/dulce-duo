/**
 * Almacén de datos DURABLE.
 * - Con DATABASE_URL (Neon/Postgres): los datos NO se pierden al actualizar Render.
 * - Sin DATABASE_URL: archivo local (solo desarrollo; en Render Free se borra al deploy).
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const DATABASE_URL = process.env.DATABASE_URL || '';

let pool = null;
let usePg = false;
let ready = false;

function defaultData() {
  try {
    const seedPath = path.join(__dirname, 'default-seed.json');
    if (fs.existsSync(seedPath)) {
      return JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    }
  } catch (_) {}
  return {
    users: [
      { id: 'u1', username: 'cajera', password: 'cajera123', role: 'cajera', name: 'Cajera Principal' },
      { id: 'u2', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrador' },
      { id: 'u3', username: 'contador', password: 'contador123', role: 'contador', name: 'Contador Externo' }
    ],
    categories: [
      { id: 'frappes', name: 'Frappés', icon: '🥤', description: 'Cremosos y helados' },
      { id: 'helados', name: 'Helados Clásicos', icon: '🍦', description: 'Conos y copas' },
      { id: 'waffles', name: 'Waffles', icon: '🧇', description: 'Waffles con helado' },
      { id: 'antojitos', name: 'Antojitos y Dulces', icon: '🍰', description: 'Postres' },
      { id: 'batidos', name: 'Batidos Naturales', icon: '🍓', description: 'Fruta fresca' },
      { id: 'tostadas-cafe', name: 'Tostadas y Café', icon: '☕', description: 'Café y tostadas' }
    ],
    products: [],
    sales: [],
    expenses: [],
    access_log: [],
    settings: { ticketPrefix: 'DD', nextTicket: 1, ivaRate: 0 }
  };
}

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData(), null, 2), 'utf8');
  }
}

function readFile() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    const d = defaultData();
    writeFile(d);
    return d;
  }
}

function writeFile(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function init() {
  if (ready) return;
  if (DATABASE_URL) {
    try {
      const { Pool } = require('pg');
      pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_state (
          id INTEGER PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      const r = await pool.query('SELECT data FROM app_state WHERE id = 1');
      if (r.rows.length === 0) {
        await pool.query(
          'INSERT INTO app_state (id, data) VALUES (1, $1::jsonb)',
          [JSON.stringify(defaultData())]
        );
        console.log('✅ Base de datos inicializada (Postgres/Neon)');
      } else {
        console.log('✅ Conectado a base de datos durable (Postgres/Neon)');
      }
      usePg = true;
    } catch (err) {
      console.error('❌ Error conectando a DATABASE_URL, usando archivo local:', err.message);
      usePg = false;
      ensureFile();
    }
  } else {
    console.warn('⚠️  Sin DATABASE_URL: datos en archivo local (en Render Free se pierden al deploy).');
    ensureFile();
    usePg = false;
  }
  ready = true;
}

async function read() {
  await init();
  if (usePg) {
    const r = await pool.query('SELECT data FROM app_state WHERE id = 1');
    if (!r.rows.length) {
      const d = defaultData();
      await write(d);
      return d;
    }
    return r.rows[0].data;
  }
  return readFile();
}

async function write(data) {
  await init();
  if (usePg) {
    await pool.query(
      `INSERT INTO app_state (id, data, updated_at) VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = $1::jsonb, updated_at = NOW()`,
      [JSON.stringify(data)]
    );
    return;
  }
  writeFile(data);
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function getFullCatalog() {
  return defaultData().products || [];
}

module.exports = {
  init,
  read,
  write,
  genId,
  defaultData,
  getFullCatalog,
  DATA_FILE,
  isDurable: () => usePg
};
