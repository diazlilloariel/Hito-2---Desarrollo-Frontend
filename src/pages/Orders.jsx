import { useEffect, useState } from "react";
import { Container, Typography, Paper, Stack, Divider, Chip, Alert, Button } from "@mui/material";
import { useApp } from "../context/AppContext.jsx";
import { Link as RouterLink } from "react-router-dom";

export default function Orders() {
  const { state, actions } = useApp();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        await actions.fetchMyOrders();
      } catch (e) {
        if (mounted) setErr(e?.message || "No se pudo cargar el historial");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [actions]);

  const list = state.orders.my;

  return (
    <Container sx={{ py: 3, maxWidth: 900 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={900}>Mis órdenes</Typography>
        <Button component={RouterLink} to="/catalogo" variant="contained" sx={{ fontWeight: 900 }}>
          Ir al catálogo
        </Button>
      </Stack>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      {loading ? (
        <Typography color="text.secondary">Cargando…</Typography>
      ) : list.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography fontWeight={900}>Aún no tienes órdenes.</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Cuando compres, acá verás tu historial.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {list.map((o) => (
            <Paper key={o.id ?? o.orderId} sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Typography fontWeight={900}>
                  Orden {o.id ?? o.orderId}
                </Typography>
                <Chip size="small" label={o.status ?? o.estado ?? "PENDIENTE"} />
              </Stack>

              <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                {o.created_at ? new Date(o.created_at).toLocaleString("es-CL") : (o.atISO ? new Date(o.atISO).toLocaleString("es-CL") : "")}
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Typography>
                Total: <b>${Number(o.total ?? o.totals?.total ?? 0).toLocaleString("es-CL")}</b>
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </Container>
  );
}
