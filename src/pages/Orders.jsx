import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";

function moneyCLP(n) {
  return `$${Number(n).toLocaleString("es-CL")}`;
}

const FILTERS = [
  { key: "ALL", label: "Todas" },
  { key: "PENDIENTE", label: "Pendiente" },
  { key: "PREPARANDO", label: "Preparando" },
  { key: "LISTO", label: "Listo" },
  { key: "ENTREGADO", label: "Entregado" },
];

export default function Orders() {
  const { state } = useApp();
  const user = state.auth.user;

  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);

  const email = (user?.email ?? "").toLowerCase();
  const statusById = state.ops?.orderStatusById ?? {};

  const myOrders = useMemo(() => {
    const list = state.orders.list
      .filter((o) => (o.customer?.email ?? "").toLowerCase() === email)
      .map((o) => ({
        ...o,
        opStatus: statusById[o.orderId] ?? "PENDIENTE",
      }));

    if (filter === "ALL") return list;
    return list.filter((o) => o.opStatus === filter);
  }, [state.orders.list, email, filter, statusById]);

  return (
    <Container sx={{ py: 3, maxWidth: 900 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={950}>
            Mis pedidos
          </Typography>
          <Typography color="text.secondary">
            Revisa tus compras y el estado operativo (pendiente → entregado).
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {FILTERS.map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                clickable
                color={filter === f.key ? "primary" : "default"}
                variant={filter === f.key ? "filled" : "outlined"}
                onClick={() => setFilter(f.key)}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, mt: 2 }}>
        {myOrders.length === 0 ? (
          <Typography color="text.secondary">
            No hay pedidos para el filtro seleccionado.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {myOrders.map((o) => (
              <Box key={o.orderId}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <Typography fontWeight={950}>{o.orderId}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip
                      size="small"
                      label={o.mode === "pickup" ? "Retiro" : "Despacho"}
                      color={o.mode === "pickup" ? "default" : "primary"}
                    />
                    <Chip size="small" label={o.opStatus} variant="outlined" />
                    <Typography color="text.secondary" variant="body2">
                      {new Date(o.atISO).toLocaleString("es-CL")}
                    </Typography>
                  </Stack>
                </Stack>

                <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                  Items: {o.items.reduce((acc, x) => acc + x.qty, 0)} · Total:{" "}
                  <b>{moneyCLP(o.totals.total)}</b>
                </Typography>

                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                  <Button variant="outlined" onClick={() => setSelected(o)}>
                    Ver detalle
                  </Button>
                </Stack>

                <Divider sx={{ mt: 2 }} />
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <OrderDetailDialog open={Boolean(selected)} order={selected} onClose={() => setSelected(null)} />
    </Container>
  );
}

function OrderDetailDialog({ open, order, onClose }) {
  if (!order) return null;
  const isDelivery = order.mode === "delivery";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Detalle {order.orderId}</DialogTitle>

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
              <Box
                key={x.id}
                sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
              >
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
// Nota: Página para que los usuarios vean sus pedidos y el estado operativo de cada uno