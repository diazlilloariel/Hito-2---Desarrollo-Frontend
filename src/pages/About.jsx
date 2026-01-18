import {
  Box,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  Chip,
} from "@mui/material";

export default function About() {
  return (
    <Container sx={{ py: 3, maxWidth: 1000 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={950}>
            Nosotros
          </Typography>
          <Typography color="text.secondary">
            Ferretex es una ferretería orientada a resolver rápido: stock claro,
            compra simple y retiro o despacho según tu necesidad.
          </Typography>

          <Divider sx={{ my: 1 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: "100%" }}>
                <Stack spacing={1}>
                  <Chip label="Operación" sx={{ alignSelf: "flex-start" }} />
                  <Typography fontWeight={900}>Enfocados en disponibilidad</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Priorizamos productos de alta rotación y reposición rápida para
                    que no pierdas tiempo buscando alternativas.
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: "100%" }}>
                <Stack spacing={1}>
                  <Chip label="Servicio" sx={{ alignSelf: "flex-start" }} />
                  <Typography fontWeight={900}>Compra sin fricción</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Catálogo directo, carrito simple y checkout claro. Retiro en tienda
                    o despacho para proyectos urgentes.
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: "100%" }}>
                <Stack spacing={1}>
                  <Chip label="Confianza" sx={{ alignSelf: "flex-start" }} />
                  <Typography fontWeight={900}>Soporte y postventa</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Te orientamos con compatibilidad básica y criterios de devolución
                    claros (en producción se conectará a procesos reales).
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography fontWeight={900}>Misión</Typography>
            <Typography color="text.secondary">
              Hacer que comprar insumos y herramientas sea rápido, transparente y
              confiable, desde el catálogo hasta la entrega.
            </Typography>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography fontWeight={900}>Visión</Typography>
            <Typography color="text.secondary">
              Ser la ferretería de referencia para compra ágil, con stock visible y
              operación digital orientada a resultados.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
// Nota: Página "Acerca de nosotros" que describe la misión, visión y valores de la ferretería