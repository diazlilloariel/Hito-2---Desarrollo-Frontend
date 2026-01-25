// src/shared/api/ferretexApi.js

// En Vite puedes definir:
// VITE_API_URL=http://localhost:3000
const API_BASE =
  (import.meta?.env?.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

/* =========================
   Helpers
========================= */
async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text; // por si el backend envía texto plano en algún error
  }
}

function buildQuery(params = {}) {
  const usp = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.set(k, String(v));
  });

  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

function httpErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  return payload?.message || payload?.error || fallback;
}

export function normalizeRole(role) {
  // Tu DB contempla: cliente/admin/staff/manager/customer
  // Tu front usa: customer/staff/manager
  const r = String(role || "").toLowerCase();

  if (r === "cliente") return "customer";
  if (r === "admin") return "manager";
  if (r === "staff") return "staff";
  if (r === "manager") return "manager";
  if (r === "customer") return "customer";

  // fallback conservador
  return "customer";
}

function normalizeProduct(p) {
  if (!p) return p;

  // Soporta formatos:
  // - { name, price, image, stock, category }
  // - { nombre, precio, imagen_url, stock_actual, category_name }
  const id = p.id;
  const name = p.name ?? p.nombre ?? "";
  const price = p.price ?? p.precio ?? 0;

  // imagen
  const image = p.image ?? p.imagen ?? p.imagen_url ?? p.image_url ?? "";

  // stock
  const stock =
    p.stock ??
    p.stock_actual ??
    p.stockActual ??
    p.inventory_stock ??
    0;

  // category puede venir como string o como nombre calculado
  const category =
    p.category ??
    p.categoria ??
    p.category_name ??
    p.categoryNombre ??
    p.category_nombre ??
    p.category_slug ??
    null;

  // status
  const status = p.status ?? "none";

  return {
    ...p,
    id,
    name,
    price,
    image,
    stock,
    category,
    status,
  };
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json; charset=utf-8" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await parseJsonSafe(res);

  if (!res.ok) {
    const msg = httpErrorMessage(payload, `HTTP ${res.status}`);
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

/* =========================
   API
========================= */
export const ferretexApi = {
  // Health
  async health() {
    return request("/api/health");
  },

  // Auth
  async register({ name, email, password, role }) {
    return request("/api/auth/register", {
      method: "POST",
      body: { name, email, password, role },
    });
  },

  async login({ email, password }) {
    const r = await request("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });

    // Normaliza rol por compatibilidad
    if (r?.user) {
      const role = normalizeRole(r.user.role ?? r.user.rol);
      r.user = { ...r.user, role };
    }
    return r;
  },

  // Products
  async getProducts(filters = {}) {
    // El backend acepta: q, cat, status, sort, inStock, minPrice, maxPrice
    const qs = buildQuery(filters);
    const list = await request(`/api/products${qs}`);
    if (!Array.isArray(list)) return [];
    return list.map(normalizeProduct);
  },

  async getProductById(id) {
    const p = await request(`/api/products/${encodeURIComponent(id)}`);
    return normalizeProduct(p);
  },

  // Orders (customer)
  async createOrder({ token, payload }) {
    return request("/api/orders", {
      method: "POST",
      token,
      body: payload,
    });
  },

  async getMyOrders({ token }) {
    const list = await request("/api/orders/me", { token });
    return Array.isArray(list) ? list : [];
  },

  // Ops (staff/manager)
  async updateOrderStatus({ token, orderId, status }) {
    return request(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      token,
      body: { status },
    });
  },
};
