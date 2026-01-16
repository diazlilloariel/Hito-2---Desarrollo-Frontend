import {
  Container,
  Typography,
  Paper,
  Stack,
  Divider,
  Box,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

function moneyCLP(n) {
  return `$${Number(n).toLocaleString("es-CL")}`;
}

function genOrderId() {
  // Mock simple
  return `FX-${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function Checkout() {
  const { state, actions } = useApp();
  const nav = useNavigate();

  const items = state.cart.items;

  const subtotal = useMemo(
    () => items.reduce((acc, x) => acc + x.price * x.qty, 0),
    [items]
  );

  const [mode, setMode] = useState("pickup"); // pickup | delivery
  const [name, setName] = useState(state.auth.user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(null); // { orderId }

  const canSubmit = useMemo(() => {
    if (!items.length) return false;
    if (!name.trim()) return false;
    if (!phone.trim()) return false;
    if (mode === "delivery" && !address.trim()) return false;
    return true;
  }, [items.length, name, phone, mode, address]);

const onConfirm = () => {
  const orderId = genOrderId();
  const atISO = new Date().toISOString();

  const order = {
    orderId,
    atISO,
    mode, // pickup | delivery
    customer: {
      name: name.trim(),
      email: state.auth.user?.email ?? "",
      phone: phone.trim(),
    },
    delivery: mode === "delivery" ? { address: address.trim() } : null,
    notes: notes.trim() || "",
    items: items.map((x) => ({
      id: x.id,
      name: x.name,
      price: x.price,
      qty: x.qty,
      lineTotal: x.price * x.qty,
    })),
    totals: {
      subtotal,
      total: subtotal, // por ahora sin shipping
    },
  };

  actions.createOrder(order); // ✅ guarda historial
  actions.clearCart();        // ✅ limpia carrito
  setDone({ orderId });
};

  if (!items.length && !done) {
    return (
      <Container sx={{ py: 3, maxWidth: 900 }}>
        <Typography variant="h5" fontWeight={900} mb={1}>
          Checkout
        </Typography>
        <Alert severity="info">
          No tienes productos en el carrito. Vuelve al catálogo para agregar productos.
        </Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => nav("/")}>
          Ir al catálogo
        </Button>
      </Container>
    );
  }

  if (done) {
    return (
      <Container sx={{ py: 3, maxWidth: 900 }}>
        <Typography variant="h5" fontWeight={900} mb={1}>
          Pedido confirmado
        </Typography>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={1.5}>
            <Alert severity="success">
              Listo. Tu pedido fue generado correctamente.
            </Alert>

            <Typography>
              Número de orden: <b>{done.orderId}</b>
            </Typography>

            <Typography color="text.secondary">
              {mode === "pickup"
                ? "Modalidad: Retiro en tienda"
                : "Modalidad: Despacho"}
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => nav("/")}>
                Volver al catálogo
              </Button>
              <Button variant="outlined" onClick={() => nav("/profile")}>
                Ir a mi perfil
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 3, maxWidth: 900 }}>
      <Typography variant="h5" fontWeight={900} mb={2}>
        Checkout
      </Typography>

      <Stack spacing={2}>
        {/* Resumen */}
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography fontWeight={900} mb={1}>
            Resumen
          </Typography>

          <Stack spacing={1}>
            {items.map((x) => (
              <Box key={x.id} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Typography>
                  {x.name} <span style={{ color: "#777" }}>x{x.qty}</span>
                </Typography>
                <Typography fontWeight={800}>{moneyCLP(x.price * x.qty)}</Typography>
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography color="text.secondary">Subtotal</Typography>
            <Typography fontWeight={900}>{moneyCLP(subtotal)}</Typography>
          </Box>
        </Paper>

        {/* Modalidad */}
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography fontWeight={900} mb={1}>
            Modalidad
          </Typography>

          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={(_, v) => v && setMode(v)}
            size="small"
          >
            <ToggleButton value="pickup">Retiro en tienda</ToggleButton>
            <ToggleButton value="delivery">Despacho</ToggleButton>
          </ToggleButtonGroup>

          {mode === "delivery" && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Despacho es simulado. En producción se calcula costo/envío por zona.
            </Alert>
          )}
        </Paper>

        {/* Datos cliente */}
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography fontWeight={900} mb={1}>
            Datos
          </Typography>

          <Stack spacing={2}>
            <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} required />

            {mode === "delivery" && (
              <TextField
                label="Dirección"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            )}

            <TextField
              label="Notas (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
            />
          </Stack>
        </Paper>

        {/* Acciones */}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" onClick={() => nav("/")}>
            Seguir comprando
          </Button>
          <Button
            variant="contained"
            sx={{ fontWeight: 900 }}
            disabled={!canSubmit}
            onClick={onConfirm}
          >
            Confirmar pedido
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
