/**
 * Almacén de datos en archivo JSON.
 * En un solo servicio de Render, todos los dispositivos comparten estos datos.
 * IMPORTANTE: en el plan gratuito de Render el disco se reinicia al redesplegar.
 * Por eso también se expone exportación/importación y se recomienda base de datos externa a futuro.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const defaultData = () => ({
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
  products: [
    { id: 101, category: 'frappes', name: 'Frappé Dulce Dúo Fresa', desc: 'Fresa natural, helado de vainilla, crema chantilly y cereza.', price: 4.50, stock: 50, min_stock: 10, emoji: '🥤', popular: true, active: true },
    { id: 102, category: 'frappes', name: 'Frappé Mocha Caramelo', desc: 'Espresso, chocolate y caramelo.', price: 4.75, stock: 40, min_stock: 8, emoji: '🧋', popular: false, active: true },
    { id: 103, category: 'frappes', name: 'Frappé Oreo Tentación', desc: 'Oreo con base cremosa.', price: 4.80, stock: 35, min_stock: 8, emoji: '🍪', popular: true, active: true },
    { id: 201, category: 'helados', name: 'Cono Dúo Corazón', desc: 'Dos bolas en cono galleta.', price: 3.25, stock: 80, min_stock: 15, emoji: '🍦', popular: true, active: true },
    { id: 202, category: 'helados', name: 'Copa Banana Split', desc: 'Tres sabores, banano y crema.', price: 5.50, stock: 30, min_stock: 5, emoji: '🍨', popular: false, active: true },
    { id: 301, category: 'waffles', name: 'Waffle Amor de Fresa', desc: 'Waffle, fresas y helado.', price: 5.75, stock: 40, min_stock: 8, emoji: '🧇', popular: true, active: true },
    { id: 401, category: 'antojitos', name: 'Brownie Tibio con Helado', desc: 'Brownie y helado de vainilla.', price: 4.60, stock: 25, min_stock: 5, emoji: '🍫', popular: true, active: true },
    { id: 501, category: 'batidos', name: 'Batido de Fresa', desc: 'Fresa natural y leche.', price: 3.50, stock: 40, min_stock: 10, emoji: '🍓', popular: true, active: true },
    { id: 601, category: 'tostadas-cafe', name: 'Café Americano', desc: 'Café pasado.', price: 1.50, stock: 100, min_stock: 20, emoji: '☕', popular: true, active: true }
  ],
  sales: [],
  expenses: [],
  access_log: [],
  settings: { ticketPrefix: 'DD', nextTicket: 1, ivaRate: 0 }
});

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData(), null, 2), 'utf8');
  }
}

function read() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    const d = defaultData();
    write(d);
    return d;
  }
}

function write(data) {
  ensure();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

module.exports = {
  read,
  write,
  genId,
  defaultData,
  DATA_FILE
};
