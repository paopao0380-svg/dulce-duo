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
    // Frappés
    { id: 101, category: 'frappes', name: 'Frappé Dulce Dúo Fresa', desc: 'Fresa natural, helado de vainilla, crema chantilly y cereza.', price: 4.50, stock: 50, min_stock: 10, emoji: '🥤', popular: true, active: true },
    { id: 102, category: 'frappes', name: 'Frappé Mocha Caramelo', desc: 'Espresso intenso, chocolate, salsa de caramelo y crema.', price: 4.75, stock: 40, min_stock: 8, emoji: '🧋', popular: false, active: true },
    { id: 103, category: 'frappes', name: 'Frappé Oreo Tentación', desc: 'Galletas Oreo trituradas con base cremosa de leche y sirope.', price: 4.80, stock: 35, min_stock: 8, emoji: '🍪', popular: true, active: true },
    { id: 104, category: 'frappes', name: 'Frappé Chocolate Belga', desc: 'Chocolate belga, helado de chocolate y crema batida.', price: 4.90, stock: 40, min_stock: 8, emoji: '🍫', popular: true, active: true },
    { id: 105, category: 'frappes', name: 'Frappé Vainilla Caramelo', desc: 'Vainilla cremosa con hilos de caramelo y chantilly.', price: 4.60, stock: 40, min_stock: 8, emoji: '🍮', popular: false, active: true },
    // Helados
    { id: 201, category: 'helados', name: 'Cono Dúo Corazón', desc: 'Dos bolas artesanales (Fresa y Vainilla) en cono galleta.', price: 3.25, stock: 80, min_stock: 15, emoji: '🍦', popular: true, active: true },
    { id: 202, category: 'helados', name: 'Copa Banana Split', desc: 'Tres sabores de helado, banano fresco, crema y nueces.', price: 5.50, stock: 30, min_stock: 5, emoji: '🍨', popular: true, active: true },
    { id: 203, category: 'helados', name: 'Tulipa Suprema de Frutos Rojos', desc: 'Canasta de barquillo con helado y coulis tibio de mora.', price: 4.90, stock: 25, min_stock: 5, emoji: '🍧', popular: false, active: true },
    { id: 204, category: 'helados', name: 'Cono Simple', desc: 'Una bola de helado artesanal a elección en cono.', price: 2.00, stock: 100, min_stock: 20, emoji: '🍦', popular: true, active: true },
    { id: 205, category: 'helados', name: 'Copa Tres Sabores', desc: 'Tres bolas de helado con salsa y crema.', price: 4.50, stock: 40, min_stock: 8, emoji: '🍨', popular: false, active: true },
    { id: 206, category: 'helados', name: 'Sundae de Chocolate', desc: 'Helado de vainilla, salsa de chocolate y chispas.', price: 3.75, stock: 35, min_stock: 8, emoji: '🍫', popular: true, active: true },
    // Waffles
    { id: 301, category: 'waffles', name: 'Waffle Amor de Fresa', desc: 'Waffle belga, fresas frescas, bola de helado y leche condensada.', price: 5.75, stock: 40, min_stock: 8, emoji: '🧇', popular: true, active: true },
    { id: 302, category: 'waffles', name: 'Waffle Choco-Avellana', desc: 'Bañado en crema de avellanas, banano caramelizado y helado.', price: 6.00, stock: 35, min_stock: 8, emoji: '🍫', popular: true, active: true },
    { id: 303, category: 'waffles', name: 'Mini Waffles Dúo (6 uds)', desc: 'Ideales para compartir con miel de maple y frutas picadas.', price: 4.50, stock: 20, min_stock: 5, emoji: '🍯', popular: false, active: true },
    { id: 304, category: 'waffles', name: 'Waffle Clásico con Helado', desc: 'Waffle dorado con una bola de helado y sirope.', price: 5.00, stock: 30, min_stock: 6, emoji: '🧇', popular: false, active: true },
    // Antojitos
    { id: 401, category: 'antojitos', name: 'Brownie Tibio con Helado', desc: 'Brownie de chocolate oscuro coronado con helado de vainilla.', price: 4.60, stock: 25, min_stock: 5, emoji: '🍫', popular: true, active: true },
    { id: 402, category: 'antojitos', name: 'Crepa de Nutella y Fresa', desc: 'Crepa fina con Nutella, fresas y azúcar glass.', price: 4.25, stock: 30, min_stock: 6, emoji: '🥞', popular: true, active: true },
    { id: 403, category: 'antojitos', name: 'Cheesecake de Frutos Rojos', desc: 'Porción de cheesecake con salsa de frutos rojos.', price: 3.90, stock: 20, min_stock: 5, emoji: '🍰', popular: false, active: true },
    { id: 404, category: 'antojitos', name: 'Churros con Chocolate (4 uds)', desc: 'Churros crujientes con salsa de chocolate caliente.', price: 3.50, stock: 40, min_stock: 8, emoji: '🍩', popular: true, active: true },
    // Batidos
    { id: 501, category: 'batidos', name: 'Batido de Fresa', desc: 'Fresa fresca seleccionada batida con leche.', price: 3.50, stock: 40, min_stock: 10, emoji: '🍓', popular: true, active: true },
    { id: 502, category: 'batidos', name: 'Batido de Banano', desc: 'Banano maduro, leche y un toque de canela.', price: 3.25, stock: 40, min_stock: 10, emoji: '🍌', popular: false, active: true },
    { id: 503, category: 'batidos', name: 'Batido de Mora', desc: 'Mora natural batida con leche y hielo.', price: 3.50, stock: 35, min_stock: 8, emoji: '🫐', popular: false, active: true },
    { id: 504, category: 'batidos', name: 'Batido Tropical', desc: 'Mix de frutas tropicales con leche.', price: 3.75, stock: 30, min_stock: 8, emoji: '🥭', popular: true, active: true },
    // Tostadas y Café
    { id: 601, category: 'tostadas-cafe', name: 'Café Americano', desc: 'Café pasado aromático.', price: 1.50, stock: 100, min_stock: 20, emoji: '☕', popular: true, active: true },
    { id: 602, category: 'tostadas-cafe', name: 'Café con Leche', desc: 'Café suave con leche caliente.', price: 1.75, stock: 80, min_stock: 15, emoji: '☕', popular: true, active: true },
    { id: 603, category: 'tostadas-cafe', name: 'Capuchino', desc: 'Espresso con espuma de leche.', price: 2.25, stock: 60, min_stock: 12, emoji: '☕', popular: false, active: true },
    { id: 604, category: 'tostadas-cafe', name: 'Tostada con Mermelada', desc: 'Pan tostado con mantequilla y mermelada.', price: 1.80, stock: 40, min_stock: 10, emoji: '🍞', popular: false, active: true },
    { id: 605, category: 'tostadas-cafe', name: 'Tostada con Aguacate', desc: 'Pan tostado con aguacate y un toque de sal.', price: 2.50, stock: 25, min_stock: 5, emoji: '🥑', popular: false, active: true }
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

function getFullCatalog() {
  return defaultData().products;
}

module.exports = {
  read,
  write,
  genId,
  defaultData,
  getFullCatalog,
  DATA_FILE
};
