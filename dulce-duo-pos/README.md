# Dulce Dúo – Sistema POS Heladería

Sistema de punto de venta (POS) + panel de administración para heladería, inspirado en Recarga Veloz.

## Características

### Para la Cajera (POS)
- Login con usuario y contraseña
- Catálogo de productos por categorías (Frappés, Helados, Waffles, Antojitos, Batidos, Tostadas y Café)
- Búsqueda rápida
- Carrito con cantidades, tipo de orden (En Local / Para Llevar)
- Control de stock en tiempo real
- Generación de ticket e impresión de recibo

### Para el Administrador
- Dashboard con:
  - Ventas del día, Gastos del día, Utilidad estimada
  - Gráfico Ingresos vs Egresos (últimos 7 días)
  - Productos más vendidos
  - Productos con stock bajo
  - Últimas ventas y últimos gastos
- Gestión completa de Inventario (crear, editar, ajustar stock, activar/desactivar)
- Registro de Gastos (proveedor, factura, IVA 0% o 15%, categoría, etc.)
- Reportes por semana / mes / rango personalizado
  - Resumen + detalle
  - Exportar a Excel (.xlsx)
  - Imprimir

## Usuarios de prueba

| Usuario  | Contraseña | Rol    |
|----------|------------|--------|
| cajera   | cajera123  | Cajera |
| admin    | admin123   | Admin  |

## Cómo usar (local)

1. Abre la carpeta `public/` en un servidor estático o simplemente abre `index.html` en el navegador (recomendado con Live Server o similar).
2. Para desarrollo con Node:

```bash
cd dulce-duo-pos
npm install
node server.js
```

Luego visita http://localhost:3000

## Despliegue en Render / GitHub

### Opción A – Sitio estático (más simple)
1. Sube el repositorio a GitHub.
2. En Render → New → Static Site
3. Root Directory: `public`
4. Build Command: (vacío)
5. Publish Directory: `.`

### Opción B – Con Express (recomendado si quieres agregar API después)
1. Root Directory: `.`
2. Build Command: `npm install`
3. Start Command: `node server.js`

## Datos
Todo se guarda en **localStorage** del navegador (MVP).  
Para uso multi-dispositivo / multi-caja se recomienda migrar a backend (Node + SQLite/Postgres).

## Estructura

```
dulce-duo-pos/
├── public/
│   ├── index.html      → Login
│   ├── pos.html        → Caja / POS
│   ├── admin.html      → Panel Admin
│   └── js/db.js        → Lógica de datos + auth
├── server.js           → Servidor Express (opcional)
├── package.json
└── README.md
```

## Próximas mejoras posibles
- Backend real con base de datos compartida
- Roles más granulares
- Múltiples cajas / sucursales
- Integración de pagos
- App móvil (PWA)

---
Desarrollado para Dulce Dúo · 2026
