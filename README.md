# Ferretex Frontend (SPA) — Demo

Frontend tipo e-commerce para ferretería con flujo de compra para cliente y panel interno para operaciones (staff/manager).  
Proyecto orientado a **evaluación y portafolio**, con UX clara, rutas limpias, estado persistido y arquitectura lista para integración backend.

---

## Stack
- React + Vite
- React Router
- Material UI (MUI)
- Persistencia local: localStorage (sesión, carrito, preferencias UI)

---

## Funcionalidades principales
### Cliente (customer)
- Navegación de catálogo con búsqueda/filtros/ordenamiento
- Detalle de producto
- Carrito de compras (agregar/quitar, cantidades)
- Flujo de orden (según integración backend)

### Operaciones (staff/manager)
- Vista interna para gestión operativa (órdenes/estado, según integración backend)
- Separación por roles (RBAC) desde el login

---

## Requisitos
- Node.js 18+ (recomendado)
- npm 9+ (o equivalente)

---

## Instalación y ejecución (local)
```bash
npm install
npm run dev
```

Abrir en el navegador la URL que entrega Vite (por defecto: `http://localhost:5173`).

---

## Variables de entorno
Crear un archivo **.env** en la raíz del frontend:

```bash
VITE_API_URL=http://localhost:3000
```

> Ajusta la URL según tu backend (local o deploy).

---

## Scripts
```bash
npm run dev      # desarrollo
npm run build    # build producción
npm run preview  # previsualizar build
npm run lint     # lint
```

---

## Convenciones de acceso (RBAC)
Roles soportados:
- `customer`
- `staff`
- `manager`

Comportamiento esperado:
- Rutas de operaciones protegidas para `staff/manager`
- Vistas de cliente para `customer`

---

## Despliegue
- Frontend: Vercel (recomendado)
- Backend: Render (recomendado)

Checklist de deploy:
- Configurar `VITE_API_URL` en variables de entorno del proveedor
- Verificar CORS en backend para permitir el dominio del frontend

---

## Licencia (Propietaria)
**Ferretex** es software propietario.  
Copyright © 2026 **Ariel Antonio Diaz Lillo**.  
Todos los derechos reservados. Ver el archivo [`LICENSE`](./LICENSE).

No se otorga permiso para usar, copiar, modificar o distribuir este software sin autorización escrita del titular.
