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
const API_BASE = (import.meta.env?.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

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
  if (status === "ready_for_pickup") return "primary";
  if (status === "preparing") return "warning";
  if (status === "paid") return "info";
  if (status === "cancelled") return "error";
  return "default";
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
    const msg = (payload && (payload.message || payload.error)) || `HTTP ${res.status}`;
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
  const canEditPrice = role === "manager";
  const isOps = role === "staff" || role === "manager";

  const token = state.auth.token || localStorage.getItem("ferretex:token") || "";

  // ✅ IMPORTANTE: overrides son solo UI. NO deben gatillar refetch.
  const priceOverrides = useMemo(
    () => state?.catalog?.prices ?? EMPTY_OBJ,
    [state?.catalog?.prices]
  );

  // UI
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Productos
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [apiProducts, setApiProducts] = useState([]); // raw API

  // Órdenes
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orders, setOrders] = useState([]);

  // Filtros
  const [q, setQ] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // all | low | out

  // Anti-doble fetch + anti titileo
  const prodHasLoadedOnceRef = useRef(false);
  const prodInFlightRef = useRef(false);
  const prodLastChangedRef = useRef(null);

  const ordHasLoadedOnceRef = useRef(false);
  const ordInFlightRef = useRef(false);
  const ordLastChangedRef = useRef(null);

  /* =========================
     Products: fetch + meta polling
  ========================= */
  const fetchProducts = async ({ showSkeletonIfEmpty = true } = {}) => {
    if (prodInFlightRef.current) return;
    prodInFlightRef.current = true;

    if (showSkeletonIfEmpty && !prodHasLoadedOnceRef.current) setLoadingProducts(true);
    setProductsError("");

    try {
      const list = await ferretexApi.getProducts({ sort: "price_asc" });

      // ✅ guardamos raw API; los overrides se aplican en el render
      const normalized = (Array.isArray(list) ? list : []).map((p) => ({
        ...p,
        price: Number(p.price ?? 0),
        stock: Number(p.stock ?? 0),
      }));

      setApiProducts(normalized);
      prodHasLoadedOnceRef.current = true;
    } catch (e) {
      setProductsError(e?.message || "No se pudieron cargar productos.");
      // No vaciar apiProducts si ya había data (evita titileo)
    } finally {
      setLoadingProducts(false);
      prodInFlightRef.current = false;
    }
  };

  // ✅ Primera carga: SOLO una vez (NO depende de priceOverrides)
  useEffect(() => {
    fetchProducts({ showSkeletonIfEmpty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Polling meta: solo refetch si lastChanged cambia
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
  }, []);

  /* =========================
     Orders: fetch + meta polling (staff/manager)
  ========================= */
  const fetchOrders = async ({ showSkeletonIfEmpty = true } = {}) => {
    if (ordInFlightRef.current) return;
    ordInFlightRef.current = true;

    if (showSkeletonIfEmpty && !ordHasLoadedOnceRef.current) setOrdersLoading(true);
    setOrdersError("");

    try {
      if (!token) throw new Error("Token requerido (inicia sesión como staff/manager).");

      const list = await apiFetchJson("/api/orders?limit=200", { token });
      const safe = Array.isArray(list) ? list : [];

      setOrders(safe);
      ordHasLoadedOnceRef.current = true;
    } catch (e) {
      setOrdersError(e?.message || "No se pudieron cargar órdenes.");
      // No vaciar si ya había data (anti titileo)
    } finally {
      setOrdersLoading(false);
      ordInFlightRef.current = false;
    }
  };

  // Primera carga órdenes
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

  // Polling meta órdenes
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

      // reflejo local inmediato
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (e) {
      setOrdersError(e?.message || "No se pudo actualizar el estado.");
    }
  };

  const openOrder = async (orderId) => {
    setSelectedOrderId(orderId);
    setSelectedOrder(null);

    try {
      if (!token) throw new Error("No autenticado.");
      const detail = await apiFetchJson(`/api/orders/${encodeURIComponent(orderId)}`, { token });
      setSelectedOrder(detail);
    } catch (e) {
      setOrdersError(e?.message || "No se pudo cargar el detalle de la orden.");
    }
  };

  /* =========================
     Derived data
  ========================= */
  const products = useMemo(() => {
    // aplica overrides en render (no refetch)
    let list = (Array.isArray(apiProducts) ? apiProducts : []).map((p) => ({
      ...p,
      price: priceOverrides[p.id] ?? p.price,
      stock: Number(p.stock ?? 0),
    }));

    const query = q.trim().toLowerCase();
    if (query) list = list.filter((x) => String(x.name).toLowerCase().includes(query));

    if (stockFilter === "low") list = list.filter((x) => x.stock > 0 && x.stock <= 5);
    if (stockFilter === "out") list = list.filter((x) => x.stock <= 0);

    return list;
  }, [apiProducts, priceOverrides, q, stockFilter]);

  const kpis = useMemo(() => {
    const all = (Array.isArray(apiProducts) ? apiProducts : []).map((p) => Number(p.stock ?? 0));
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
      <Alert severity="warning" sx={{ mb: 2, borderRadius: 3, position: "sticky", top: 72, zIndex: 1 }}>
        <b>Modo interno:</b> inventario y órdenes vienen desde backend + base de datos. Se actualiza solo cuando la BD cambia (meta polling).
      </Alert>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <Typography variant="h5" fontWeight={900}>
          Panel interno — Ferretex
        </Typography>

        <Typography color="text.secondary">
          Acceso: <b>{canEditPrice ? "Encargado (manager)" : "Personal (staff)"}</b>
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
              <Button variant="outlined" sx={{ fontWeight: 800 }} onClick={() => fetchProducts({ showSkeletonIfEmpty: false })}>
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
            Inicia sesión como <b>staff</b> o <b>manager</b> para ver el tablero de órdenes.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {KANBAN_COLUMNS.map((col) => {
              const list = ordersByStatus[col.key] ?? [];
              return (
                <Grid key={col.key} item xs={12} sm={6} lg={3}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, height: "100%" }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
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
                            sx={{ p: 1.25, borderRadius: 2.5, border: "1px solid rgba(0,0,0,0.08)" }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
                              <Typography fontWeight={900}>{o.id}</Typography>
                              <Chip
                                size="small"
                                label={o.status}
                                color={statusColor(o.status)}
                                variant={o.status === "pending_payment" ? "outlined" : "filled"}
                              />
                            </Stack>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {o.created_at ? new Date(o.created_at).toLocaleString("es-CL") : "—"}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                              Total: <b>${Number(o.total ?? 0).toLocaleString("es-CL")}</b>
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                              <Button size="small" variant="outlined" onClick={() => openOrder(o.id)}>
                                Ver detalle
                              </Button>

                              {o.status !== "preparing" && o.status !== "delivered" && o.status !== "cancelled" && (
                                <Button size="small" variant="outlined" onClick={() => updateOrderStatus(o.id, "preparing")}>
                                  Preparando
                                </Button>
                              )}
                              {o.status !== "ready_for_pickup" && o.status !== "delivered" && o.status !== "cancelled" && (
                                <Button size="small" variant="outlined" onClick={() => updateOrderStatus(o.id, "ready_for_pickup")}>
                                  Lista
                                </Button>
                              )}
                              {o.status !== "delivered" && o.status !== "cancelled" && (
                                <Button size="small" variant="outlined" onClick={() => updateOrderStatus(o.id, "delivered")}>
                                  Entregada
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
            Lista real desde DB. Se refresca automáticamente si el catálogo cambia.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
          <TextField
            size="small"
            label="Buscar producto"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ minWidth: 260 }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Stock</InputLabel>
            <Select value={stockFilter} label="Stock" onChange={(e) => setStockFilter(e.target.value)}>
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="low">Bajo stock</MenuItem>
              <MenuItem value="out">Sin stock</MenuItem>
            </Select>
          </FormControl>

          <Chip size="small" label={`Resultados: ${products.length}`} />

          <Button variant="outlined" sx={{ fontWeight: 800 }} onClick={() => fetchProducts({ showSkeletonIfEmpty: false })}>
            Actualizar
          </Button>
        </Stack>

        {productsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {productsError}
          </Alert>
        )}

        {/* Skeleton solo si NO hay data */}
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
              return (
                <Grid key={p.id} item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 3 }}>
                    <Stack spacing={1.2}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                        <Typography fontWeight={900}>{p.name}</Typography>
                        <Chip size="small" label={chip.label} color={chip.color} />
                      </Box>

                      <Typography color="text.secondary">
                        SKU: <b>{p.sku || "—"}</b> · Categoría: <b>{p.category || "—"}</b>
                      </Typography>

                      <Typography color="text.secondary">
                        Stock: <b>{p.stock ?? 0}</b>
                      </Typography>

                      <Typography>
                        Precio actual: <b>${Number(p.price ?? 0).toLocaleString("es-CL")}</b>
                      </Typography>

                      {canEditPrice ? (
                        <PriceEditor
                          currentPrice={p.price}
                          onSave={() =>
                            alert(
                              "Aún falta backend para actualizar precio (PATCH /api/products/:id/price). " +
                                "Cuando lo creemos, este botón actualizará la BD."
                            )
                          }
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          *Solo el encargado puede editar precios.
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
    </Container>
  );
}

/* =========================
   Components
========================= */
function PriceEditor({ currentPrice, onSave }) {
  const [value, setValue] = useState(String(currentPrice));
  const parsed = Number(String(value).replace(/[^\d]/g, ""));
  const isValid = Number.isFinite(parsed) && parsed > 0;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <TextField
        size="small"
        label="Nuevo precio"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        sx={{ flex: 1 }}
      />
      <Button
        variant="contained"
        disabled={!isValid}
        onClick={() => onSave(parsed)}
        sx={{ fontWeight: 800, whiteSpace: "nowrap" }}
      >
        Guardar
      </Button>
    </Stack>
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
                <Box key={`${it.productId}-${idx}`} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography>
                    {it.name || it.productId} <span style={{ color: "#777" }}>x{it.qty}</span>
                  </Typography>
                  <Typography fontWeight={900}>${Number(it.lineTotal ?? 0).toLocaleString("es-CL")}</Typography>
                </Box>
              ))}
            </Stack>

            <Divider />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography color="text.secondary">Total</Typography>
              <Typography fontWeight={900}>${Number(order.total ?? 0).toLocaleString("es-CL")}</Typography>
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
