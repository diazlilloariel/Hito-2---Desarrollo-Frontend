import { Button, Container, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function NotFound() {
  return (
    <Container sx={{ py: 3, maxWidth: 900 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={950}>
            Página no encontrada
          </Typography>
          <Typography color="text.secondary">
            La ruta no existe. Vuelve al catálogo o al inicio.
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            <Button variant="contained" component={RouterLink} to="/catalogo" sx={{ fontWeight: 900 }}>
              Ir al catálogo
            </Button>
            <Button variant="outlined" component={RouterLink} to="/">
              Inicio
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
// Nota: Página que se muestra cuando la ruta no existe, con opciones para volver al catálogo o al inicio