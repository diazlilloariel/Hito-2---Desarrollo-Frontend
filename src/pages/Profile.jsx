import {
  Container,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  Alert,
  Button,
  Skeleton,
  Box,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

function formatCLP(n) {
  const v = Number(n ?? 0);
  return v.toLocaleString("es-CL");
}

export default function Profile() {
  const { state, actions } = useApp();
  const nav = useNavigate();

  const user = state?.auth?.user ?? null;
  const token = state?.auth?.token || localStorage.getItem("ferretex:token") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]); // ✅ siempre array

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        if (!token) throw new Error("No hay sesión activa (token faltante).");

        const r = await fetch(`${API_BASE}/api/orders/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!r.ok) {
          const msg = await r.text().catch(() => "");
          throw new Error(msg || `No se pudieron cargar tus órdenes (${r.status}).`);
        }

        const data = await r.json();
        if (!alive) return;

        setOrders(Array.isArray(data) ? data : []); // ✅ fallback seguro
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Error cargando perfil.");
        setOrders([]); // ✅ estado consistente
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [token]);

  const kpis = useMemo(() => {
    const list = Array.isArray(orders) ? orders : []; // ✅
    const totalOrders = list.length;
    const totalSpent = list.reduce((acc, o) => acc + Number(o.total ?? 0), 0);
    const pending = list.filter((o) => String(o.status) === "pending_payment").length;
    const paid = list.filter((o) => String(o.status) === "paid").length;
    return { totalOrders, totalSpent, pending, paid };
  }, [orders]);

  const logout = () => {
    localStorage.removeItem("ferretex:token");
    actions?.logout?.();
    nav("/");
  };

  if (!user) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">
          No hay usuario cargado en sesión. Inicia sesión para ver tu perfil.
        </Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => nav("/login")}>
          Ir a Login
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
          <Stack>
            <Typography variant="h4" fontWeight={950}>
              Perfil
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              Datos de cuenta y tus órdenes (desde backend).
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`Rol: ${user.role ?? "customer"}`} />
            <Button variant="outlined" onClick={logout} sx={{ fontWeight: 900 }}>
              Cerrar sesión
            </Button>
          </Stack>
        </Stack>

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography fontWeight={900} sx={{ mb: 1 }}>
            Cuenta
          </Typography>
          <Stack spacing={0.5}>
            <Typography>
              Nombre: <b>{user.name ?? "—"}</b>
            </Typography>
            <Typography>
              Email: <b>{user.email ?? "—"}</b>
            </Typography>
            <Typography>
              Id: <b>{user.id ?? "—"}</b>
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography fontWeight={900} sx={{ mb: 1 }}>
            Resumen
          </Typography>

          {loading ? (
            <Stack spacing={1}>
              <Skeleton height={28} width="40%" />
              <Skeleton height={22} width="60%" />
              <Skeleton height={22} width="50%" />
            </Stack>
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
              <Chip label={`Órdenes: ${kpis.totalOrders}`} />
              <Chip label={`Pendientes pago: ${kpis.pending}`} />
              <Chip label={`Pagadas: ${kpis.paid}`} />
              <Chip label={`Total gastado: $${formatCLP(kpis.totalSpent)}`} />
            </Stack>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography fontWeight={900} sx={{ mb: 1 }}>
            Mis órdenes
          </Typography>

          {loading ? (
            <Stack spacing={1}>
              <Skeleton height={56} />
              <Skeleton height={56} />
            </Stack>
          ) : orders.length === 0 ? (
            <Alert severity="info">Aún no tienes órdenes.</Alert>
          ) : (
            <Stack spacing={1.25}>
              {orders.map((o) => (
                <Box
                  key={o.id}
                  sx={{
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 2.5,
                    p: 1.5,
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    gap={1}
                  >
                    <Typography fontWeight={900}>{o.id}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip size="small" label={o.delivery_type || "—"} />
                      <Chip size="small" label={o.payment_method || "—"} />
                      <Chip size="small" label={o.status || "—"} />
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 1 }} />

                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha: {o.created_at ? new Date(o.created_at).toLocaleString("es-CL") : "—"}
                    </Typography>
                    <Typography variant="body2">
                      Total: <b>${formatCLP(o.total)}</b>
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
