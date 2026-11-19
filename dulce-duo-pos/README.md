# Dulce Dúo — Sistema POS Heladería

Sistema de ventas, inventario y reportes contables.
Datos compartidos en el servidor: funciona desde cualquier PC o celular.

## Usuarios

| Usuario    | Contraseña    | Rol |
|------------|---------------|-----|
| cajera     | cajera123     | Ventas (POS) |
| admin      | admin123      | Dueño (todo) |
| contador   | contador123   | Reportes SRI (solo lectura) |

## Reglas del negocio

- Ventas **sin IVA**
- Gastos a proveedores **con IVA** cuando la factura lo traiga
- Pago: **Efectivo** o **Transferencia**

## Estructura del proyecto

```
dulce-duo-pos/
├── server.js
├── package.json
├── db/store.js
└── public/
    ├── index.html
    ├── pos.html
    ├── admin.html
    └── js/db.js
```

## Despliegue en Render (Web Service)

1. Sube esta carpeta completa a GitHub.
2. En Render: **New +** → **Web Service** (no Static Site).
3. Conecta el repositorio.
4. Configura:
   - **Root Directory:** `dulce-duo-pos` (o vacío si el repo es solo esta carpeta)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Create Web Service → espera **Live**.
6. Abre la URL e inicia sesión.

## Local

```bash
npm install
npm start
```

Abre http://localhost:3000
