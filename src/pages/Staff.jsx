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
} from "@mui/material";
import { useMemo, useState } from "react";
import { products as baseProducts } from "../data/products.js";
import { useApp } from "../context/AppContext.jsx";

function stockChip(stock) {
  if (stock <= 0) return { label: "SIN STOCK", color: "error" };
  if (stock <= 5) return { label: "BAJO", color: "error" };
  if (stock <= 15) return { label: "ATENCIÓN", color: "warning" };
  return { label: "OK", color: "success" };
}

const KANBAN_COLUMNS = [
  { key: "PENDIENTE", title: "Pendiente" },
  { key: "PREPARANDO", title: "Preparando" },
  { key: "LISTO", title: "Listo" },
  { key: "ENTREGADO", title: "Entregado" },
];

function statusColor(status) {
  if (status === "ENTREGADO") return "success";
  if (status === "LISTO") return "primary";
  if (status === "PREPARANDO") return "warning";
  return "default";
}

export default function Staff() {
  const { state, actions } = useApp();

  const role = state.auth.user?.role ?? "staff";
  const canEditPrice = role === "manager";

  const [selectedOrder, setSelectedOrder] = useState(null);

  const statusById = state.ops?.orderStatusById ?? {};

  const [q, setQ] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // all | low | out

  const products = useMemo(() => {
    let list = baseProducts.map((p) => ({
      ...p,
      price: state.catalog.prices[p.id] ?? p.price,
      stock: Number(p.stock ?? 0),
    }));

    const query = q.trim().toLowerCase();
    if (query) list = list.filter((x) => x.name.toLowerCase().includes(query));

    if (stockFilter === "low") list = list.filter((x) => x.stock > 0 && x.stock <= 5);
    if (stockFilter === "out") list = list.filter((x) => x.stock <= 0);

    return list;
  }, [state.catalog.prices, q, stockFilter]);

  const audit = state.audit.priceChanges;

  const ordersByStatus = useMemo(() => {
    const groups = { PENDIENTE: [], PREPARANDO: [], LISTO: [], ENTREGADO: [] };

    for (const o of state.orders.list) {
      const st = statusById[o.orderId] ?? "PENDIENTE";
      (groups[st] ?? groups.PENDIENTE).push(o);
    }

    return groups;
  }, [state.orders.list, statusById]);

  const kpis = useMemo(() => {
    const all = baseProducts.map((p) => Number(p.stock ?? 0));
    const out = all.filter((s) => s <= 0).length;
    const low = all.filter((s) => s > 0 && s <= 5).length;

    const pending = state.orders.list.filter((o) => (statusById[o.orderId] ?? "PENDIENTE") === "PENDIENTE").length;
    const preparing = state.orders.list.filter((o) => (statusById[o.orderId] ?? "PENDIENTE") === "PREPARANDO").length;
    const ready = state.orders.list.filter((o) => (statusById[o.orderId] ?? "PENDIENTE") === "LISTO").length;

    return { out, low, pending, preparing, ready };
  }, [state.orders.list, statusById]);

  const setStatus = (orderId, status) => actions.setOrderStatus(orderId, status);
  const resetStatus = (orderId) => actions.resetOrderStatus(orderId);

  return (
    <Container sx={{ py: 3 }}>
      <Alert
        severity="warning"
        sx={{ mb: 2, borderRadius: 3, position: "sticky", top: 72, zIndex: 1 }}
      >
        <b>Modo interno:</b> revisa con cuidado. Los cambios se reflejarán y pueden
        impactar con las ventas o clientes.
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
          Acceso: <b>{canEditPrice ? "Encargado" : "Personal"}</b>
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
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography color="text.secondary" variant="body2">
              Pendientes
            </Typography>
            <Typography variant="h5" fontWeight={950}>
              {kpis.pending}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography color="text.secondary" variant="body2">
              Preparando
            </Typography>
            <Typography variant="h5" fontWeight={950}>
              {kpis.preparing}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography color="text.secondary" variant="body2">
              Listas
            </Typography>
            <Typography variant="h5" fontWeight={950}>
              {kpis.ready}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Kanban */}
      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography fontWeight={900}>Órdenes — Operación</Typography>
          <Typography variant="body2" color="text.secondary">
            Flujo: Pendiente → Preparando → Listo → Entregado.
          </Typography>
        </Stack>

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

                  {list.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Sin órdenes.
                    </Typography>
                  ) : (
                    <Stack spacing={1.25}>
                      {list.map((o) => {
                        const status = statusById[o.orderId] ?? "PENDIENTE";
                        const itemsCount = o.items.reduce((acc, x) => acc + x.qty, 0);

                        return (
                          <Paper
                            key={o.orderId}
                            sx={{
                              p: 1.25,
                              borderRadius: 2.5,
                              border: "1px solid rgba(0,0,0,0.08)",
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
                              <Typography fontWeight={900}>{o.orderId}</Typography>

                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  size="small"
                                  label={o.mode === "pickup" ? "Retiro" : "Despacho"}
                                  color={o.mode === "pickup" ? "default" : "primary"}
                                />
                                <Chip
                                  size="small"
                                  label={status}
                                  color={statusColor(status)}
                                  variant={status === "PENDIENTE" ? "outlined" : "filled"}
                                />
                              </Stack>
                            </Stack>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {new Date(o.atISO).toLocaleString("es-CL")}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                              Items: {itemsCount} · Total:{" "}
                              <b>${Number(o.totals.total).toLocaleString("es-CL")}</b>
                            </Typography>

                            {o.mode === "delivery" && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                Dirección: <b>{o.delivery?.address || "—"}</b>
                              </Typography>
                            )}

                            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                              <Button size="small" variant="outlined" onClick={() => setSelectedOrder(o)}>
                                Ver detalle
                              </Button>

                              {status !== "PREPARANDO" && status !== "ENTREGADO" && (
                                <Button size="small" variant="outlined" onClick={() => setStatus(o.orderId, "PREPARANDO")}>
                                  Preparando
                                </Button>
                              )}

                              {status !== "LISTO" && status !== "ENTREGADO" && (
                                <Button size="small" variant="outlined" onClick={() => setStatus(o.orderId, "LISTO")}>
                                  Listo
                                </Button>
                              )}

                              {status !== "ENTREGADO" && (
                                <Button size="small" variant="outlined" onClick={() => setStatus(o.orderId, "ENTREGADO")}>
                                  Entregado
                                </Button>
                              )}

                              <Button size="small" onClick={() => resetStatus(o.orderId)}>
                                Reset
                              </Button>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Catálogo interno + historial */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={canEditPrice ? 8 : 12}>
          <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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
            </Stack>
          </Paper>

          <Grid container spacing={2}>
            {products.map((p) => {
              const chip = stockChip(p.stock ?? 0);

              return (
                <Grid key={p.id} item xs={12} md={6} lg={6}>
                  <Paper sx={{ p: 2, borderRadius: 3 }}>
                    <Stack spacing={1.2}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                        <Typography fontWeight={900}>{p.name}</Typography>
                        <Chip size="small" label={chip.label} color={chip.color} />
                      </Box>

                      <Typography color="text.secondary">
                        Stock: <b>{p.stock ?? 0}</b>
                      </Typography>

                      <Typography>
                        Precio actual: <b>${Number(p.price).toLocaleString("es-CL")}</b>
                      </Typography>

                      {canEditPrice ? (
                        <PriceEditor
                          currentPrice={p.price}
                          onSave={(newPrice) =>
                            actions.updatePrice({ id: p.id, oldPrice: p.price, newPrice })
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
        </Grid>

        {canEditPrice && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderRadius: 3, position: "sticky", top: 140 }}>
              <Typography fontWeight={900} mb={1}>
                Historial de cambios
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Registro local (mock).
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {audit.length === 0 ? (
                <Typography color="text.secondary">Sin cambios aún.</Typography>
              ) : (
                <Stack spacing={1.2}>
                  {audit.slice(0, 12).map((a, idx) => (
                    <Box key={`${a.id}-${a.atISO}-${idx}`}>
                      <Typography fontWeight={800} variant="body2">
                        {a.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${Number(a.oldPrice).toLocaleString("es-CL")} →{" "}
                        <b>${Number(a.newPrice).toLocaleString("es-CL")}</b>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {a.actorEmail} · {new Date(a.atISO).toLocaleString("es-CL")}
                      </Typography>
                      <Divider sx={{ mt: 1 }} />
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      <OrderDetailDialog open={Boolean(selectedOrder)} order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </Container>
  );
}

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

function OrderDetailDialog({ open, order, onClose }) {
  if (!order) return null;

  const isDelivery = order.mode === "delivery";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Detalle orden {order.orderId}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Typography color="text.secondary" variant="body2">
            {new Date(order.atISO).toLocaleString("es-CL")}
          </Typography>

          <Chip
            size="small"
            label={isDelivery ? "Despacho" : "Retiro en tienda"}
            color={isDelivery ? "primary" : "default"}
            sx={{ alignSelf: "flex-start" }}
          />

          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography fontWeight={800}>Contacto</Typography>
            <Typography color="text.secondary">
              {order.customer?.name || "—"} · {order.customer?.phone || "—"}
            </Typography>
          </Paper>

          {isDelivery && (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography fontWeight={800}>Dirección</Typography>
              <Typography color="text.secondary">{order.delivery?.address || "—"}</Typography>
            </Paper>
          )}

          {order.notes ? (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography fontWeight={800}>Notas</Typography>
              <Typography color="text.secondary">{order.notes}</Typography>
            </Paper>
          ) : null}

          <Divider />

          <Typography fontWeight={900}>Items</Typography>
          <Stack spacing={1}>
            {order.items.map((x) => (
              <Box key={x.id} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Typography>
                  {x.name} <span style={{ color: "#777" }}>x{x.qty}</span>
                </Typography>
                <Typography fontWeight={800}>
                  ${Number(x.lineTotal).toLocaleString("es-CL")}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Divider />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography color="text.secondary">Total</Typography>
            <Typography fontWeight={900}>
              ${Number(order.totals.total).toLocaleString("es-CL")}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
// Nota: Página de personal interno para gestionar inventario y órdenes