// src/shared/api/ferretexApi.js

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
    return text;
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
  const r = String(role || "").toLowerCase();
  if (r === "cliente") return "customer";
  if (r === "admin") return "manager";
  if (r === "staff") return "staff";
  if (r === "manager") return "manager";
  if (r === "customer") return "customer";
  return "customer";
}

function normalizeProduct(p) {
  if (!p) return p;

  const id = p.id;
  const name = p.name ?? p.nombre ?? "";
  const price = p.price ?? p.precio ?? 0;

  const image = p.image ?? p.imagen ?? p.imagen_url ?? p.image_url ?? "";

  const stock =
    p.stock ??
    p.stock_actual ??
    p.stockActual ??
    p.inventory_stock ??
    p.stock_available ??
    0;

  const category =
    p.category ??
    p.categoria ??
    p.category_name ??
    p.categoryNombre ??
    p.category_nombre ??
    p.category_slug ??
    null;

  const status = p.status ?? "none";

  return { ...p, id, name, price, image, stock, category, status };
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

  /* ========== Auth ========== */
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

    if (r?.user) {
      const role = normalizeRole(r.user.role ?? r.user.rol);
      r.user = { ...r.user, role };
    }
    return r;
  },

  // Verificación de password para acciones sensibles (manager)
  async verifyPassword({ token, password }) {
    if (!token) throw new Error("Token requerido.");
    if (!password) throw new Error("Password requerido.");

    return request("/api/auth/verify-password", {
      method: "POST",
      token,
      body: { password },
    });
  },

  /* ========== Categories ========== */
  async getCategories() {
    const list = await request("/api/categories");
    return Array.isArray(list) ? list : [];
  },

  /* ========== Products ========== */
  async getProducts(filters = {}) {
    const qs = buildQuery(filters);
    const list = await request(`/api/products${qs}`);
    if (!Array.isArray(list)) return [];
    return list.map(normalizeProduct);
  },

  async getProductById(id) {
    const p = await request(`/api/products/${encodeURIComponent(id)}`);
    return normalizeProduct(p);
  },

  async getProductsMeta() {
    return request("/api/products/meta");
  },

  // Crear producto (manager)
  async createProduct({ token, data }) {
    if (!token) throw new Error("Token requerido.");

    const payload = { ...(data ?? {}) };
    if (payload.price !== undefined) payload.price = Number(payload.price);

    if (
      payload.stock_on_hand !== undefined &&
      payload.stock_on_hand !== null &&
      payload.stock_on_hand !== ""
    ) {
      payload.stock_on_hand = Number(payload.stock_on_hand);
    }

    const r = await request("/api/products", {
      method: "POST",
      token,
      body: payload,
    });

    if (r?.product) r.product = normalizeProduct(r.product);
    return r;
  },

  // Update producto (manager)
  async updateProduct({ token, productId, data }) {
    if (!token) throw new Error("Token requerido.");
    if (!productId) throw new Error("productId requerido.");

    const payload = { ...(data ?? {}) };
    if (payload.price !== undefined) payload.price = Number(payload.price);

    const r = await request(`/api/products/${encodeURIComponent(productId)}`, {
      method: "PATCH",
      token,
      body: payload,
    });

    if (r?.product) r.product = normalizeProduct(r.product);
    return r;
  },

  // Soft delete (manager)
  async deactivateProduct({ token, productId }) {
    if (!token) throw new Error("Token requerido.");
    if (!productId) throw new Error("productId requerido.");

    return request(`/api/products/${encodeURIComponent(productId)}/deactivate`, {
      method: "PATCH",
      token,
    });
  },

  // Stock (staff/manager)
  async updateInventory({ token, productId, stock_on_hand }) {
    if (!token) throw new Error("Token requerido.");
    if (!productId) throw new Error("productId requerido.");

    const n = Number(stock_on_hand);
    if (!Number.isInteger(n) || n < 0) {
      throw new Error("stock_on_hand inválido (entero >= 0).");
    }

    return request(`/api/inventory/${encodeURIComponent(productId)}`, {
      method: "PATCH",
      token,
      body: { stock_on_hand: n },
    });
  },

  /* ========== ✅ Inventory read (staff/manager) ========== */
  async getInventory({ token }) {
    if (!token) throw new Error("Token requerido.");
    const list = await request("/api/inventory", { token });
    if (!Array.isArray(list)) return [];

    // Mantiene compatibilidad: stock = stock_available
    return list.map((row) => {
      const normalized = normalizeProduct(row);
      return {
        ...normalized,
        stock_on_hand: Number(row.stock_on_hand ?? 0),
        stock_reserved: Number(row.stock_reserved ?? 0),
        stock_available: Number(row.stock_available ?? normalized.stock ?? 0),
        stock: Number(row.stock_available ?? normalized.stock ?? 0),
      };
    });
  },

  /* ========== Orders (customer) ========== */
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

  /* ========== Ops (staff/manager) ========== */
  async getOrdersMeta({ token }) {
    return request("/api/orders/meta", { token });
  },

  async getOrders({ token, filters = {} } = {}) {
    const qs = buildQuery(filters);
    const list = await request(`/api/orders${qs}`, { token });
    return Array.isArray(list) ? list : [];
  },

  async getOrderById({ token, orderId }) {
    return request(`/api/orders/${encodeURIComponent(orderId)}`, { token });
  },

  async updateOrderStatus({ token, orderId, status }) {
    return request(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      token,
      body: { status },
    });
  },
};
