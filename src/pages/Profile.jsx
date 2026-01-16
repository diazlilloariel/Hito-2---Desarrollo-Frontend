import {
  Container,
  Paper,
  Typography,
  Stack,
  Divider,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";

function moneyCLP(n) {
  return `$${Number(n).toLocaleString("es-CL")}`;
}

export default function Profile() {
  const { state } = useApp();
  const user = state.auth.user;

  const [selected, setSelected] = useState(null); // orden seleccionada para modal

  const myOrders = useMemo(() => {
    const email = (user?.email ?? "").toLowerCase();
    return state.orders.list.filter(
      (o) => (o.customer?.email ?? "").toLowerCase() === email
    );
  }, [state.orders.list, user?.email]);

  return (
    <Container sx={{ py: 4, maxWidth: 900 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={900}>
          Mi perfil
        </Typography>
        <Typography>Nombre: {user?.name}</Typography>
        <Typography>Email: {user?.email}</Typography>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, mt: 2 }}>
        <Typography variant="h6" fontWeight={900} mb={1}>
          Historial de compras
        </Typography>

        {myOrders.length === 0 ? (
          <Typography color="text.secondary">
            Aún no tienes compras registradas.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {myOrders.map((o) => (
              <Box key={o.orderId}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                  flexWrap="wrap"
                >
                  <Typography fontWeight={900}>Orden {o.orderId}</Typography>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      size="small"
                      label={o.mode === "pickup" ? "Retiro" : "Despacho"}
                      color={o.mode === "pickup" ? "default" : "primary"}
                    />
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

      {/* Modal detalle */}
      <OrderDetailDialog
        open={Boolean(selected)}
        order={selected}
        onClose={() => setSelected(null)}
      />
    </Container>
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

          {isDelivery && (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography fontWeight={800}>Dirección</Typography>
              <Typography color="text.secondary">
                {order.delivery?.address || "—"}
              </Typography>
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
                <Typography fontWeight={800}>{moneyCLP(x.lineTotal)}</Typography>
              </Box>
            ))}
          </Stack>

          <Divider />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography color="text.secondary">Total</Typography>
            <Typography fontWeight={900}>{moneyCLP(order.totals.total)}</Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

function moneyCLP(n) {
  return `$${Number(n).toLocaleString("es-CL")}`;
}
