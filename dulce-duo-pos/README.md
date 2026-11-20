# Dulce Dúo — Sistema POS Heladería

Sistema de ventas, inventario y reportes. Los datos se guardan en **base de datos en la nube** para que no se pierdan al actualizar el sistema.

## Usuarios

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| cajera | cajera123 | Ventas |
| admin | admin123 | Administración |
| contador | contador123 | Reportes (solo lectura) |

## Despliegue en Render (Web Service)

### 1. Sube el código a GitHub

### 2. Crea base de datos gratis (Neon) — solo una vez

1. Entra a https://neon.tech y crea cuenta (gratis).
2. Create project → copia la **Connection string** (empieza con `postgresql://...`).
3. En Render, en tu Web Service → **Environment** → Add Environment Variable:
   - Key: `DATABASE_URL`
   - Value: (pega la connection string de Neon)
4. Save.

Sin `DATABASE_URL`, en Render Free las ventas se pueden borrar al actualizar.

### 3. Web Service en Render

- **Root Directory:** `dulce-duo-pos` (o vacío si el repo es esa carpeta)
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- Plan: Free

## Local

```bash
npm install
npm start
```

Opcional: `export DATABASE_URL='postgresql://...'`
