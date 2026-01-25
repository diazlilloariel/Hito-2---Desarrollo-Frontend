// src/shared/api/api.js
import { ferretexApi, normalizeRole } from "./ferretexApi.js";

export const api = {
  // Auth
  async register({ name, email, password }) {
    return ferretexApi.register({ name, email, password });
  },

  async login({ email, password }) {
    const r = await ferretexApi.login({ email, password });

    // Normaliza rol por si backend devuelve "cliente"/"admin"
    const user = r?.user
      ? { ...r.user, role: normalizeRole(r.user.role ?? r.user.rol) }
      : null;

    return { token: r?.token, user };
  },

  // Products
  async products(filters) {
    return ferretexApi.getProducts(filters);
  },

  async productById(id) {
    return ferretexApi.getProductById(id);
  },

  // Orders
  async createOrder({ token, payload }) {
    return ferretexApi.createOrder({ token, payload });
  },

  async myOrders({ token }) {
    return ferretexApi.getMyOrders({ token });
  },

  async updateOrderStatus({ token, orderId, status }) {
    return ferretexApi.updateOrderStatus({ token, orderId, status });
  },
};
