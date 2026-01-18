import {
  Box,
  Container,
  Divider,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function AppFooter() {
  // Datos ficticios
  const storeName = "Ferretex";
  const tagline = "Ferretería urbana · Retiro y despacho";
  const addressLabel = "Av. Los Maestros 1450, Santiago, Chile";
  const googleMapsUrl =
    "https://www.google.com/maps/search/?api=1&query=Av.+Los+Maestros+1450,+Santiago,+Chile";
  const hoursLabel = "Lun a Sáb: 09:00 - 19:30 · Dom: 10:00 - 14:00";
  const phoneLabel = "+56 9 8765 4321";
  const phoneTel = "+56987654321";
  const emailLabel = "soporte@ferretex-demo.cl";

  const year = new Date().getFullYear();

  return (
    <Box sx={{ mt: 6 }}>
      <Paper sx={{ borderRadius: 0, bgcolor: "grey.100" }} elevation={0}>
        <Divider />
        <Container sx={{ py: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <Stack spacing={0.75}>
                <Typography fontWeight={950}>{storeName}</Typography>

                <Typography color="text.secondary" variant="body2">
                  {tagline}
                </Typography>

                <Typography color="text.secondary" variant="body2">
                  Ferretería y suministros. Compra online para retiro o despacho.
                </Typography>

                <Typography color="text.secondary" variant="body2">
                  Email:{" "}
                  <Link href={`mailto:${emailLabel}`} underline="hover">
                    {emailLabel}
                  </Link>
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  *Demo frontend. Precios/stock simulados para evaluación.
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={0.75}>
                <Typography fontWeight={900}>Tienda</Typography>

                <Typography variant="body2" color="text.secondary">
                  Dirección:{" "}
                  <Link
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                  >
                    {addressLabel}
                  </Link>
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Horario: {hoursLabel}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Teléfono:{" "}
                  <Link href={`tel:${phoneTel}`} underline="hover">
                    {phoneLabel}
                  </Link>
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} md={3}>
              <Stack spacing={0.75}>
                <Typography fontWeight={900}>Información</Typography>

                <Link component={RouterLink} to="/catalogo" underline="hover">
                  Catálogo
                </Link>

                <Link component={RouterLink} to="/about" underline="hover">
                  Nosotros
                </Link>

                <Link component={RouterLink} to="/policies" underline="hover">
                  Políticas y devoluciones
                </Link>

                <Link component={RouterLink} to="/contact" underline="hover">
                  Contacto
                </Link>

                <Typography variant="body2" color="text.secondary">
                  Respuesta en horario de atención.
                </Typography>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            © {year} {storeName}. Todos los derechos reservados.
          </Typography>
        </Container>
      </Paper>
    </Box>
  );
}
