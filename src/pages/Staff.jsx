import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { ferretexApi } from "../shared/api/ferretexApi.js";

/* =========================
   Const / Helpers
========================= */
const EMPTY_OBJ = Object.freeze({});
const API_BASE = (import.meta.env?.VITE_API_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

function stockChip(stock) {
  const s = Number(stock ?? 0);
  if (s <= 0) return { label: "SIN STOCK", color: "error" };
  if (s <= 5) return { label: "BAJO", color: "error" };
  if (s <= 15) return { label: "ATENCIÓN", color: "warning" };
  return { label: "OK", color: "success" };
}

const KANBAN_COLUMNS = [
  { key: "pending_payment", title: "Pendiente pago" },
  { key: "paid", title: "Pagada" },
  { key: "preparing", title: "Preparando" },
  { key: "ready_for_pickup", title: "Lista (retiro)" },
  { key: "shipped", title: "En despacho" },
  { key: "delivered", title: "Entregada" },
  { key: "cancelled", title: "Cancelada" },
];

function statusColor(status) {
  if (status === "delivered") return "success";
  if (status === "shipped") return "secondary";
  if (status === "ready_for_pickup") return "primary";
  if (status === "preparing") return "warning";
  if (status === "paid") return "info";
  if (status === "cancelled") return "error";
  return "default";
}

function formatHourCL(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

async function apiFetchJson(path, { token, method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json; charset=utf-8" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    const msg =
      (payload && (payload.message || payload.error)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

/* =========================
   Staff
========================= */
export default function Staff() {
  const { state } = useApp();

  const role = state.auth.user?.role ?? "staff";
  const canEditProduct = role === "manager";
  const isOps = role === "staff" || role === "manager";

  const token =
    state.auth.token || localStorage.getItem("ferretex:token") || "";

  // UI-only overrides (no refetch)
  const priceOverrides = useMemo(
    () => state?.catalog?.prices ?? EMPTY_OBJ,
    [state?.catalog?.prices]
  );

  // UI
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Productos / Inventario
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [apiProducts, setApiProducts] = useState([]);

  // Órdenes
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orders, setOrders] = useState([]);

  // Filtros
  const [q, setQ] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  // Categorías (para editor producto)
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState("");

  // Editor producto (manager)
  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  // Crear producto (manager)
  const [createOpen, setCreateOpen] = useState(false);

  // Soft delete (manager)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  // ✅ Cancelar orden (manager) - doble verificación
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [cancelPassword, setCancelPassword] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  // Anti-doble fetch + anti titileo
  const prodHasLoadedOnceRef = useRef(false);
  const prodInFlightRef = useRef(false);
  const prodLastChangedRef = useRef(null);

  const ordHasLoadedOnceRef = useRef(false);
  const ordInFlightRef = useRef(false);
  const ordLastChangedRef = useRef(null);

  /* =========================
     Inventory: fetch + meta polling (cambio mínimo)
     - Si hay token y es staff/manager -> usa /api/inventory
     - Si no -> cae a /api/products (compat)
  ========================= */
  const fetchProducts = async ({ showSkeletonIfEmpty = true } = {}) => {
    if (prodInFlightRef.current) return;
    prodInFlightRef.current = true;

    if (showSkeletonIfEmpty && !prodHasLoadedOnceRef.current)
      setLoadingProducts(true);
    setProductsError("");

    try {
      let list = [];

      if (isOps && token) {
        list = await ferretexApi.getInventory({ token });
      } else {
        list = await ferretexApi.getProducts({ sort: "price_asc" });
      }

      const normalized = (Array.isArray(list) ? list : []).map((p) => ({
        ...p,
        price: Number(p.price ?? 0),
        stock: Number(p.stock ?? p.stock_available ?? 0),

        // si vienen del inventory endpoint
        stock_on_hand:
          p.stock_on_hand !== undefined ? Number(p.stock_on_hand) : undefined,
        stock_reserved:
          p.stock_reserved !== undefined ? Number(p.stock_reserved) : undefined,
        stock_available:
          p.stock_available !== undefined
            ? Number(p.stock_available)
            : undefined,
      }));

      setApiProducts(normalized);
      prodHasLoadedOnceRef.current = true;
    } catch (e) {
      setProductsError(e?.message || "No se pudieron cargar productos.");
    } finally {
      setLoadingProducts(false);
      prodInFlightRef.current = false;
    }
  };

  useEffect(() => {
    fetchProducts({ showSkeletonIfEmpty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOps, token]);

  useEffect(() => {
    let alive = true;
    let timer = null;

    const tick = async () => {
      try {
        if (document.visibilityState === "hidden") return;

        const meta = await apiFetchJson("/api/products/meta");
        if (!alive) return;

        const last = meta?.lastChanged ? String(meta.lastChanged) : null;
        if (!last) return;

        if (prodLastChangedRef.current === null) {
          prodLastChangedRef.current = last;
          return;
        }

        if (last !== prodLastChangedRef.current) {
          prodLastChangedRef.current = last;
          await fetchProducts({ showSkeletonIfEmpty: false });
        }
      } catch {
        // silencioso
      }
    };

    tick();
    timer = window.setInterval(tick, 4000);

    return () => {
      alive = false;
      if (timer) window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOps, token]);

  /* =========================
     Categories (manager)
  ========================= */
  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        if (!canEditProduct) return;
        setCategoriesError("");
        const list = await ferretexApi.getCategories();
        if (!alive) return;
        setCategories(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setCategoriesError(e?.message || "No se pudieron cargar categorías.");
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [canEditProduct]);

  /* =========================
     Orders: fetch + meta polling (staff/manager)
  ========================= */
  const fetchOrders = async ({ showSkeletonIfEmpty = true } = {}) => {
    if (ordInFlightRef.current) return;
    ordInFlightRef.current = true;

    if (showSkeletonIfEmpty && !ordHasLoadedOnceRef.current)
      setOrdersLoading(true);
    setOrdersError("");

    try {
      if (!token)
        throw new Error("Token requerido (inicia sesión como staff/manager).");

      const list = await apiFetchJson("/api/orders?limit=200", { token });
      const safe = Array.isArray(list) ? list : [];

      setOrders(safe);
      ordHasLoadedOnceRef.current = true;
    } catch (e) {
      setOrdersError(e?.message || "No se pudieron cargar órdenes.");
    } finally {
      setOrdersLoading(false);
      ordInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (!isOps) {
      setOrdersLoading(false);
      setOrders([]);
      setOrdersError("Acceso restringido: solo staff/manager.");
      return;
    }
    if (!token) {
      setOrdersLoading(false);
      setOrdersError("Token requerido (inicia sesión como staff/manager).");
      return;
    }

    fetchOrders({ showSkeletonIfEmpty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOps, token]);

  useEffect(() => {
    let alive = true;
    let timer = null;

    const tick = async () => {
      try {
        if (!isOps) return;
        if (!token) return;
        if (document.visibilityState === "hidden") return;

        const meta = await apiFetchJson("/api/orders/meta", { token });
        if (!alive) return;

        const last = meta?.lastChanged ? String(meta.lastChanged) : null;
        if (!last) return;

        if (ordLastChangedRef.current === null) {
          ordLastChangedRef.current = last;
          return;
        }

        if (last !== ordLastChangedRef.current) {
          ordLastChangedRef.current = last;
          await fetchOrders({ showSkeletonIfEmpty: false });
        }
      } catch {
        // silencioso
      }
    };

    tick();
    timer = window.setInterval(tick, 4000);

    return () => {
      alive = false;
      if (timer) window.clearInterval(timer);
    };
  }, [isOps, token]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      if (!token) throw new Error("No autenticado.");
      await ferretexApi.updateOrderStatus({ token, orderId, status });

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (e) {
      setOrdersError(e?.message || "No se pudo actualizar el estado.");
    }
  };

  const openOrder = async (orderId) => {
    setSelectedOrderId(orderId);
    setSelectedOrder(null);

    try {
      if (!token) throw new Error("No autenticado.");
      const detail = await apiFetchJson(
        `/api/orders/${encodeURIComponent(orderId)}`,
        { token }
      );
      setSelectedOrder(detail);
    } catch (e) {
      setOrdersError(e?.message || "No se pudo cargar el detalle de la orden.");
    }
  };

  /* =========================
     ✅ Cancel order (manager): doble verificación
  ========================= */
  const askCancelOrder = (order) => {
    if (!canEditProduct) return;

    const ok1 = window.confirm(
      `Vas a CANCELAR esta orden:\n\n${order?.id}\n\nEsto libera reservas y marca la orden como "cancelled".\n¿Continuar?`
    );
    if (!ok1) return;

    setCancelOrder(order);
    setCancelPassword("");
    setCancelOpen(true);
  };

  const confirmCancelOrder = async () => {
    try {
      if (!cancelOrder?.id) return;
      if (!token) throw new Error("Token requerido.");
      if (!canEditProduct) throw new Error("Acceso restringido: solo manager.");

      setCancelBusy(true);
      setOrdersError("");

      await ferretexApi.verifyPassword({ token, password: cancelPassword });

      await ferretexApi.updateOrderStatus({
        token,
        orderId: cancelOrder.id,
        status: "cancelled",
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelOrder.id ? { ...o, status: "cancelled" } : o
        )
      );

      setCancelOpen(false);
      setCancelOrder(null);
      setCancelPassword("");
    } catch (e) {
      setOrdersError(e?.message || "No se pudo cancelar la orden.");
    } finally {
      setCancelBusy(false);
    }
  };

  /* =========================
     Product ops (manager)
  ========================= */
  const openProductEditor = (p) => {
    setProductsError("");
    setEditProduct(p);
    setEditOpen(true);
  };

  const updateProductAll = async (productId, payload) => {
    try {
      setProductsError("");
      if (!token) throw new Error("Token requerido (inicia sesión como manager).");
      if (!canEditProduct) throw new Error("Acceso restringido: solo manager.");

      const productPayload = { ...payload };
      const stockOnHand = productPayload.stock_on_hand;
      delete productPayload.stock_on_hand;

      await ferretexApi.updateProduct({
        token,
        productId,
        data: productPayload,
      });

      if (
        stockOnHand !== undefined &&
        stockOnHand !== null &&
        String(stockOnHand) !== ""
      ) {
        await ferretexApi.updateInventory({
          token,
          productId,
          stock_on_hand: stockOnHand,
        });
      }

      await fetchProducts({ showSkeletonIfEmpty: false });

      setEditOpen(false);
      setEditProduct(null);
    } catch (e) {
      setProductsError(e?.message || "No se pudo actualizar el producto.");
    }
  };

  const createProduct = async (payload) => {
    try {
      setProductsError("");
      if (!token) throw new Error("Token requerido (inicia sesión como manager).");
      if (!canEditProduct) throw new Error("Acceso restringido: solo manager.");

      await ferretexApi.createProduct({ token, data: payload });

      await fetchProducts({ showSkeletonIfEmpty: false });
      setCreateOpen(false);
    } catch (e) {
      setProductsError(e?.message || "No se pudo crear el producto.");
    }
  };

  const askSoftDelete = (p) => {
    if (!canEditProduct) return;

    const ok1 = window.confirm(
      `Vas a desactivar (soft delete) este producto:\n\n${p?.name} (${p?.sku})\n\n¿Continuar?`
    );
    if (!ok1) return;

    setDeleteProduct(p);
    setDeletePassword("");
    setDeleteOpen(true);
  };

  const confirmSoftDelete = async () => {
    try {
      if (!deleteProduct?.id) return;
      if (!token) throw new Error("Token requerido.");
      if (!canEditProduct) throw new Error("Acceso restringido: solo manager.");

      setDeleteBusy(true);
      setProductsError("");

      await ferretexApi.verifyPassword({ token, password: deletePassword });

      await ferretexApi.deactivateProduct({ token, productId: deleteProduct.id });

      await fetchProducts({ showSkeletonIfEmpty: false });

      setDeleteOpen(false);
      setDeleteProduct(null);
      setDeletePassword("");
    } catch (e) {
      setProductsError(e?.message || "No se pudo desactivar el producto.");
    } finally {
      setDeleteBusy(false);
    }
  };

  /* =========================
     Derived data
  ========================= */
  const products = useMemo(() => {
    let list = (Array.isArray(apiProducts) ? apiProducts : []).map((p) => ({
      ...p,
      price: priceOverrides[p.id] ?? p.price,
      stock: Number(p.stock ?? 0),
    }));

    const query = q.trim().toLowerCase();
    if (query)
      list = list.filter((x) => String(x.name).toLowerCase().includes(query));

    if (stockFilter === "low")
      list = list.filter((x) => x.stock > 0 && x.stock <= 5);
    if (stockFilter === "out") list = list.filter((x) => x.stock <= 0);

    return list;
  }, [apiProducts, priceOverrides, q, stockFilter]);

  const kpis = useMemo(() => {
    const all = (Array.isArray(apiProducts) ? apiProducts : []).map((p) =>
      Number(p.stock ?? 0)
    );
    const out = all.filter((s) => s <= 0).length;
    const low = all.filter((s) => s > 0 && s <= 5).length;
    return { out, low };
  }, [apiProducts]);

  const ordersByStatus = useMemo(() => {
    const groups = {};
    for (const col of KANBAN_COLUMNS) groups[col.key] = [];

    for (const o of orders) {
      const st = o.status ?? "pending_payment";
      (groups[st] ?? groups.pending_payment).push(o);
    }

    for (const k of Object.keys(groups)) {
      groups[k].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return groups;
  }, [orders]);

  return (
    <Container sx={{ py: 3 }}>
      <Alert
        severity="warning"
        sx={{ mb: 2, borderRadius: 3, position: "sticky", top: 72, zIndex: 1 }}
      >
        <b>Modo interno:</b> inventario y órdenes vienen desde backend + base de
        datos. Se actualiza solo cuando la BD cambia (meta polling).
      </Alert>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={900}>
          Panel interno — Ferretex
        </Typography>

        <Typography color="text.secondary">
          Acceso:{" "}
          <b>{canEditProduct ? "Encargado (manager)" : "Personal (staff)"}</b>
        </Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography color="text.secondary" variant="body2">
              Sin stock
            </Typography>
            <Typography variant="h5" fontWeight={950}>
              {kpis.out}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography color="text.secondary" variant="body2">
              Bajo stock (≤ 5)
            </Typography>
            <Typography variant="h5" fontWeight={950}>
              {kpis.low}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography color="text.secondary" variant="body2">
              Operación
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
              <Button
                variant="outlined"
                sx={{ fontWeight: 800 }}
                onClick={() => fetchProducts({ showSkeletonIfEmpty: false })}
              >
                Refrescar productos
              </Button>
              <Button
                variant="outlined"
                sx={{ fontWeight: 800 }}
                disabled={!isOps}
                onClick={() => fetchOrders({ showSkeletonIfEmpty: false })}
              >
                Refrescar órdenes
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Órdenes */}
      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography fontWeight={900}>Órdenes — Operación</Typography>
          <Typography variant="body2" color="text.secondary">
            pending_payment → paid → preparing → ready_for_pickup → shipped → delivered.
          </Typography>
        </Stack>

        {ordersError && (
          <Alert severity={isOps ? "error" : "info"} sx={{ mb: 2 }}>
            {ordersError}
          </Alert>
        )}

        {!isOps ? (
          <Typography variant="body2" color="text.secondary">
            Inicia sesión como <b>staff</b> o <b>manager</b> para ver el tablero
            de órdenes.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {KANBAN_COLUMNS.map((col) => {
              const list = ordersByStatus[col.key] ?? [];
              return (
                <Grid key={col.key} item xs={12} sm={6} lg={3}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 3, height: "100%" }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Typography fontWeight={900}>{col.title}</Typography>
                      <Chip size="small" label={list.length} />
                    </Stack>

                    <Divider sx={{ mb: 1.5 }} />

                    {ordersLoading && orders.length === 0 ? (
                      <Stack spacing={1}>
                        <Skeleton height={48} />
                        <Skeleton height={48} />
                        <Skeleton height={48} />
                      </Stack>
                    ) : list.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Sin órdenes.
                      </Typography>
                    ) : (
                      <Stack spacing={1.25}>
                        {list.slice(0, 10).map((o) => (
                          <Paper
                            key={o.id}
                            sx={{
                              p: 1.25,
                              borderRadius: 2.5,
                              border: "1px solid rgba(0,0,0,0.08)",
                            }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              gap={1}
                              flexWrap="wrap"
                            >
                              <Typography fontWeight={900}>{o.id}</Typography>
                              <Chip
                                size="small"
                                label={o.status}
                                color={statusColor(o.status)}
                                variant={
                                  o.status === "pending_payment"
                                    ? "outlined"
                                    : "filled"
                                }
                              />
                            </Stack>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              Hora creación: <b>{formatHourCL(o.created_at)}</b>
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.25 }}
                            >
                              Total:{" "}
                              <b>${Number(o.total ?? 0).toLocaleString("es-CL")}</b>
                            </Typography>

                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ mt: 1 }}
                              flexWrap="wrap"
                            >
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => openOrder(o.id)}
                              >
                                Ver detalle
                              </Button>

                              {o.status !== "preparing" &&
                                o.status !== "delivered" &&
                                o.status !== "cancelled" && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() =>
                                      updateOrderStatus(o.id, "preparing")
                                    }
                                  >
                                    Preparando
                                  </Button>
                                )}

                              {o.status !== "ready_for_pickup" &&
                                o.status !== "delivered" &&
                                o.status !== "cancelled" && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() =>
                                      updateOrderStatus(o.id, "ready_for_pickup")
                                    }
                                  >
                                    Lista
                                  </Button>
                                )}

                              {/* ✅ SOLO MANAGER: En despacho -> shipped */}
                              {canEditProduct &&
                                o.status !== "shipped" &&
                                o.status !== "delivered" &&
                                o.status !== "cancelled" && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() =>
                                      updateOrderStatus(o.id, "shipped")
                                    }
                                  >
                                    En despacho
                                  </Button>
                                )}

                              {o.status !== "delivered" &&
                                o.status !== "cancelled" && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() =>
                                      updateOrderStatus(o.id, "delivered")
                                    }
                                  >
                                    Entregada
                                  </Button>
                                )}

                              {/* ✅ SOLO MANAGER: Cancelar con doble verificación */}
                              {canEditProduct &&
                                o.status !== "cancelled" &&
                                o.status !== "delivered" && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => askCancelOrder(o)}
                                  >
                                    Cancelar orden
                                  </Button>
                                )}
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>

      {/* Inventario */}
      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography fontWeight={900}>Inventario — Productos</Typography>
          <Typography variant="body2" color="text.secondary">
            Vista real desde DB. Si estás logueado como staff/manager, usa
            <b> /api/inventory</b> (on hand / reservado / disponible).
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          sx={{ mb: 2 }}
        >
          <TextField
            size="small"
            label="Buscar producto"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ minWidth: 260 }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Stock</InputLabel>
            <Select
              value={stockFilter}
              label="Stock"
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="low">Bajo stock</MenuItem>
              <MenuItem value="out">Sin stock</MenuItem>
            </Select>
          </FormControl>

          <Chip size="small" label={`Resultados: ${products.length}`} />

          <Button
            variant="outlined"
            sx={{ fontWeight: 800 }}
            onClick={() => fetchProducts({ showSkeletonIfEmpty: false })}
          >
            Actualizar
          </Button>

          {canEditProduct ? (
            <Button
              variant="contained"
              sx={{ fontWeight: 900 }}
              onClick={() => setCreateOpen(true)}
            >
              Agregar producto
            </Button>
          ) : null}
        </Stack>

        {productsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {productsError}
          </Alert>
        )}

        {categoriesError && canEditProduct ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {categoriesError}
          </Alert>
        ) : null}

        {loadingProducts && apiProducts.length === 0 ? (
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} item xs={12} md={6}>
                <Paper sx={{ p: 2, borderRadius: 3 }}>
                  <Skeleton height={28} width="60%" />
                  <Skeleton height={22} width="40%" />
                  <Skeleton height={22} width="55%" />
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={2}>
            {products.map((p) => {
              const chip = stockChip(p.stock ?? 0);

              const hasEnterprise =
                p.stock_on_hand !== undefined &&
                p.stock_reserved !== undefined &&
                p.stock_available !== undefined;

              return (
                <Grid key={p.id} item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 3 }}>
                    <Stack spacing={1.2}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        <Typography fontWeight={900}>{p.name}</Typography>
                        <Chip size="small" label={chip.label} color={chip.color} />
                      </Box>

                      <Typography color="text.secondary">
                        SKU: <b>{p.sku || "—"}</b> · Categoría:{" "}
                        <b>{p.category || "—"}</b>
                      </Typography>

                      {hasEnterprise ? (
                        <Typography color="text.secondary">
                          On hand: <b>{p.stock_on_hand}</b> · Reservado:{" "}
                          <b>{p.stock_reserved}</b> · Disponible:{" "}
                          <b>{p.stock_available}</b>
                        </Typography>
                      ) : (
                        <Typography color="text.secondary">
                          Stock: <b>{p.stock ?? 0}</b>
                        </Typography>
                      )}

                      <Typography>
                        Precio actual:{" "}
                        <b>${Number(p.price ?? 0).toLocaleString("es-CL")}</b>
                      </Typography>

                      {canEditProduct ? (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          <Button
                            variant="contained"
                            sx={{ fontWeight: 900 }}
                            onClick={() => openProductEditor(p)}
                          >
                            Editar producto
                          </Button>

                          <Button
                            variant="outlined"
                            color="error"
                            sx={{ fontWeight: 900 }}
                            onClick={() => askSoftDelete(p)}
                          >
                            Eliminar
                          </Button>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          *Solo el encargado puede editar productos.
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>

      <OrderDetailDialog
        open={Boolean(selectedOrderId)}
        order={selectedOrder}
        orderId={selectedOrderId}
        onClose={() => {
          setSelectedOrderId(null);
          setSelectedOrder(null);
        }}
      />

      <ProductEditDialog
        open={editOpen}
        product={editProduct}
        categories={categories}
        onClose={() => {
          setEditOpen(false);
          setEditProduct(null);
        }}
        onSave={(payload) => updateProductAll(editProduct?.id, payload)}
      />

      <ProductCreateDialog
        open={createOpen}
        categories={categories}
        onClose={() => setCreateOpen(false)}
        onSave={(payload) => createProduct(payload)}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        product={deleteProduct}
        password={deletePassword}
        setPassword={setDeletePassword}
        busy={deleteBusy}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteProduct(null);
          setDeletePassword("");
        }}
        onConfirm={confirmSoftDelete}
      />

      <CancelOrderConfirmDialog
        open={cancelOpen}
        order={cancelOrder}
        password={cancelPassword}
        setPassword={setCancelPassword}
        busy={cancelBusy}
        onClose={() => {
          setCancelOpen(false);
          setCancelOrder(null);
          setCancelPassword("");
        }}
        onConfirm={confirmCancelOrder}
      />
    </Container>
  );
}

/* =========================
   Components
========================= */
function ProductEditDialog({ open, product, categories, onClose, onSave }) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [stockOnHand, setStockOnHand] = useState("");

  useEffect(() => {
    if (!open || !product) return;

    setSku(product.sku ?? "");
    setName(product.name ?? "");
    setCategory(product.category ?? "");
    setPrice(String(product.price ?? ""));
    setStatus(product.status ?? "");
    setImage(product.image ?? "");
    setDescription(product.description ?? "");

    // ✅ cambio mínimo: si viene del inventory endpoint, usa stock_on_hand
    const baseStock =
      product.stock_on_hand !== undefined ? product.stock_on_hand : product.stock;
    setStockOnHand(String(baseStock ?? ""));
  }, [open, product]);

  const parsedPrice = Number(String(price).replace(/[^\d]/g, ""));
  const parsedStock =
    stockOnHand === "" ? null : Number(String(stockOnHand).replace(/[^\d]/g, ""));

  const canSave =
    String(sku).trim() &&
    String(name).trim() &&
    String(category).trim() &&
    Number.isFinite(parsedPrice) &&
    parsedPrice >= 0 &&
    (parsedStock === null ||
      (Number.isInteger(parsedStock) && parsedStock >= 0));

  const payload = {
    sku: String(sku).trim(),
    name: String(name).trim(),
    category: String(category).trim(),
    price: parsedPrice,
    status: String(status).trim() || undefined,
    image: String(image).trim() || "",
    description: String(description).trim() || "",
    stock_on_hand: parsedStock === null ? undefined : parsedStock,
  };

  const hasCategories = Array.isArray(categories) && categories.length > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar producto</DialogTitle>

      <DialogContent dividers>
        {!product ? (
          <Typography variant="body2" color="text.secondary">
            Selecciona un producto.
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            <TextField label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
            <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />

            {hasCategories ? (
              <FormControl>
                <InputLabel>Categoría</InputLabel>
                <Select label="Categoría" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.name}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                label="Categoría"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                helperText="No se pudieron cargar categorías; ingrésala manualmente."
              />
            )}

            <TextField label="Precio" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />

            <TextField
              label="Stock (stock_on_hand)"
              value={stockOnHand}
              onChange={(e) => setStockOnHand(e.target.value)}
              inputMode="numeric"
              helperText="Actualiza inventory.stock_on_hand"
            />

            <TextField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} />

            <TextField label="Imagen (URL)" value={image} onChange={(e) => setImage(e.target.value)} />

            <TextField
              label="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={!canSave} onClick={() => onSave(payload)} sx={{ fontWeight: 900 }}>
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ProductCreateDialog({ open, categories, onClose, onSave }) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("none");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [stockOnHand, setStockOnHand] = useState("0");

  useEffect(() => {
    if (!open) return;
    setSku("");
    setName("");
    setCategory(categories?.[0]?.name ?? "");
    setPrice("");
    setStatus("none");
    setImage("");
    setDescription("");
    setStockOnHand("0");
  }, [open, categories]);

  const parsedPrice = Number(String(price).replace(/[^\d]/g, ""));
  const parsedStock = Number(String(stockOnHand).replace(/[^\d]/g, ""));

  const canSave =
    String(sku).trim() &&
    String(name).trim() &&
    String(category).trim() &&
    Number.isFinite(parsedPrice) &&
    parsedPrice >= 0 &&
    Number.isInteger(parsedStock) &&
    parsedStock >= 0;

  const payload = {
    sku: String(sku).trim(),
    name: String(name).trim(),
    category: String(category).trim(),
    price: parsedPrice,
    status: String(status).trim() || "none",
    image: String(image).trim() || "",
    description: String(description).trim() || "",
    active: true,
    stock_on_hand: parsedStock,
  };

  const hasCategories = Array.isArray(categories) && categories.length > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Agregar producto</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.25}>
          <TextField label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />

          {hasCategories ? (
            <FormControl>
              <InputLabel>Categoría</InputLabel>
              <Select label="Categoría" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.name}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              label="Categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              helperText="No se pudieron cargar categorías; ingrésala manualmente."
            />
          )}

          <TextField label="Precio" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />

          <TextField
            label="Stock inicial (stock_on_hand)"
            value={stockOnHand}
            onChange={(e) => setStockOnHand(e.target.value)}
            inputMode="numeric"
          />

          <TextField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} />

          <TextField label="Imagen (URL)" value={image} onChange={(e) => setImage(e.target.value)} />

          <TextField
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={!canSave} onClick={() => onSave(payload)} sx={{ fontWeight: 900 }}>
          Crear
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteConfirmDialog({ open, product, password, setPassword, busy, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Eliminar producto (soft delete)</DialogTitle>

      <DialogContent dividers>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          Acción sensible: este producto quedará <b>inactivo</b> (active=false) y desaparecerá del catálogo público.
        </Alert>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Producto: <b>{product?.name ?? "—"}</b> · SKU: <b>{product?.sku ?? "—"}</b>
        </Typography>

        <TextField
          type="password"
          label="Confirmar con contraseña (manager)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          autoFocus
        />

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Se validará contra <b>/api/auth/verify-password</b>.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={busy || !String(password).trim()}
          sx={{ fontWeight: 900 }}
        >
          {busy ? "Procesando..." : "Eliminar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CancelOrderConfirmDialog({ open, order, password, setPassword, busy, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Cancelar orden (acción sensible)</DialogTitle>

      <DialogContent dividers>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          Esta acción marcará la orden como <b>cancelled</b> y liberará reservas.
        </Alert>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Orden: <b>{order?.id ?? "—"}</b>
        </Typography>

        <TextField
          type="password"
          label="Confirmar con contraseña (manager)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          autoFocus
        />

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Se validará contra <b>/api/auth/verify-password</b>.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={busy || !String(password).trim()}
          sx={{ fontWeight: 900 }}
        >
          {busy ? "Procesando..." : "Cancelar orden"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function OrderDetailDialog({ open, order, orderId, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Detalle orden {orderId || "—"}</DialogTitle>

      <DialogContent dividers>
        {!order ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Cargando detalle...
            </Typography>
            <Skeleton height={26} />
            <Skeleton height={26} />
            <Skeleton height={26} />
          </Stack>
        ) : (
          <Stack spacing={1.25}>
            <Typography variant="body2" color="text.secondary">
              Estado: <b>{order.status}</b> · Tipo: <b>{order.delivery_type}</b> · Pago:{" "}
              <b>{order.payment_method}</b>
            </Typography>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography fontWeight={900}>Cliente</Typography>
              <Typography color="text.secondary">
                {order.customer?.name || "—"} · {order.customer?.email || "—"} · {order.customer?.phone || "—"}
              </Typography>
            </Paper>

            {order.address ? (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Typography fontWeight={900}>Dirección</Typography>
                <Typography color="text.secondary">
                  {order.address?.line1 || "—"} {order.address?.line2 || ""}
                </Typography>
                <Typography color="text.secondary">
                  {order.address?.comuna || "—"} · {order.address?.ciudad || "—"}
                </Typography>
              </Paper>
            ) : null}

            <Divider />

            <Typography fontWeight={900}>Items</Typography>
            <Stack spacing={0.75}>
              {(order.items || []).map((it, idx) => (
                <Box
                  key={`${it.productId}-${idx}`}
                  sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
                >
                  <Typography>
                    {it.name || it.productId} <span style={{ color: "#777" }}>x{it.qty}</span>
                  </Typography>
                  <Typography fontWeight={900}>
                    ${Number(it.lineTotal ?? 0).toLocaleString("es-CL")}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Divider />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography color="text.secondary">Total</Typography>
              <Typography fontWeight={900}>
                ${Number(order.total ?? 0).toLocaleString("es-CL")}
              </Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
