import {
  Container,
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import BoltIcon from "@mui/icons-material/Bolt";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReplayIcon from "@mui/icons-material/Replay";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import { useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { products as baseProducts } from "../data/products.js";
import ProductCard from "../shared/components/ProductCard.jsx";

export default function Home() {
  const { state } = useApp();
  const role = state.auth.user?.role ?? "customer";
  const isStaff = role === "staff" || role === "manager";

  const featured = useMemo(() => {
    // Aplica override de precios (mock manager) también en Home
    const p = baseProducts.map((prod) => ({
      ...prod,
      price: state.catalog.prices[prod.id] ?? prod.price,
      status: prod.status ?? "none",
    }));

    // Prioriza offer/new como destacados
    const priority = p
      .filter((x) => x.status === "offer" || x.status === "new")
      .slice(0, 3);

    if (priority.length >= 3) return priority;

    // Rellena con el resto si no alcanza
    const rest = p.filter((x) => !priority.some((y) => y.id === x.id));
    return [...priority, ...rest].slice(0, 3);
  }, [state.catalog.prices]);

  const categories = useMemo(
    () => [
      { name: "Herramientas", cat: "herramientas", hint: "Taladros, kits, accesorios" },
      { name: "Fijaciones", cat: "fijaciones", hint: "Tornillos, tarugos, pernos" },
      { name: "Seguridad", cat: "seguridad", hint: "Guantes, lentes, EPP" },
      { name: "Electricidad", cat: "electricidad", hint: "Cables, enchufes, testers" },
    ],
    []
  );

  return (
    <Box>
      {/* HERO */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "#fff",
          py: { xs: 5, md: 7 },
        }}
      >
        <Container>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={1.5}>
                <Typography variant="h3" fontWeight={950} sx={{ lineHeight: 1.1 }}>
                  Ferretex
                </Typography>

                <Typography sx={{ opacity: 0.9, maxWidth: 620 }}>
                  {isStaff
                    ? "Control operativo de stock, órdenes y precios desde un panel interno simple y confiable."
                    : "Herramientas y suministros para tu proyecto. Compra online con retiro en tienda o despacho."}
                </Typography>

                {!isStaff && (
                  <Stack
                    spacing={1}
                    sx={{
                      pt: 1,
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "stretch", sm: "center" },
                    }}
                  >
                    <Button
                      variant="contained"
                      color="secondary"
                      component={RouterLink}
                      to="/catalogo"
                      sx={{ fontWeight: 900, width: { xs: "100%", sm: "auto" } }}
                    >
                      Ir al catálogo
                    </Button>

                    {!state.auth.isAuth && (
                      <Button
                        variant="outlined"
                        color="inherit"
                        component={RouterLink}
                        to="/login"
                        sx={{
                          borderColor: "rgba(255,255,255,0.6)",
                          width: { xs: "100%", sm: "auto" },
                        }}
                      >
                        Iniciar sesión
                      </Button>
                    )}

                    <Button
                      variant="text"
                      color="inherit"
                      component={RouterLink}
                      to="/about"
                      sx={{
                        color: "rgba(255,255,255,0.9)",
                        width: { xs: "100%", sm: "auto" },
                      }}
                    >
                      Conocer Ferretex
                    </Button>
                  </Stack>
                )}

                {isStaff && (
                  <Stack
                    spacing={1}
                    sx={{
                      pt: 1,
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "stretch", sm: "center" },
                    }}
                  >
                    <Button
                      variant="contained"
                      color="secondary"
                      component={RouterLink}
                      to="/staff"
                      sx={{ fontWeight: 900, width: { xs: "100%", sm: "auto" } }}
                    >
                      Ir a panel interno
                    </Button>
                    <Chip
                      label="Modo interno"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.18)",
                        color: "#fff",
                        fontWeight: 800,
                        width: { xs: "fit-content", sm: "auto" },
                      }}
                    />
                  </Stack>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                <Stack spacing={1.25}>
                  <Typography fontWeight={900}>Compra rápida</Typography>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <StorefrontIcon fontSize="small" />
                    <Typography sx={{ opacity: 0.9 }}>Retiro en tienda</Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocalShippingIcon fontSize="small" />
                    <Typography sx={{ opacity: 0.9 }}>Despacho (simulado)</Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <VerifiedUserIcon fontSize="small" />
                    <Typography sx={{ opacity: 0.9 }}>
                      Flujo claro: catálogo → carrito → checkout
                    </Typography>
                  </Stack>

                  {!isStaff && (
                    <>
                      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>
                        Revisa ofertas y productos nuevos directo en el catálogo.
                      </Typography>
                    </>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* BENEFICIOS */}
      <Container sx={{ py: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2.25, borderRadius: 3, height: "100%" }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <StorefrontIcon />
                  <Typography fontWeight={900}>Retiro en tienda</Typography>
                </Stack>
                <Typography color="text.secondary">
                  Ideal si necesitas el producto hoy. Pagas online y retiras.
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2.25, borderRadius: 3, height: "100%" }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocalShippingIcon />
                  <Typography fontWeight={900}>Despacho</Typography>
                </Stack>
                <Typography color="text.secondary">
                  Planificado para domicilio. En producción se calcula por zona.
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2.25, borderRadius: 3, height: "100%" }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <VerifiedUserIcon />
                  <Typography fontWeight={900}>Experiencia confiable</Typography>
                </Stack>
                <Typography color="text.secondary">
                  Estados claros, orden generada y seguimiento desde tu perfil.
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* CATEGORÍAS (PRO: navega con querystring) */}
      {!isStaff && (
        <Container sx={{ pb: 3 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={1}
              sx={{ mb: 1.5 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={950}>
                  Categorías populares
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Entra directo filtrado por categoría.
                </Typography>
              </Box>

              <Button
                component={RouterLink}
                to="/catalogo"
                variant="outlined"
                sx={{ fontWeight: 900 }}
              >
                Explorar catálogo
              </Button>
            </Stack>

            <Grid container spacing={2}>
              {categories.map((c) => (
                <Grid key={c.cat} item xs={12} sm={6} md={3}>
                  <Paper
                    component={RouterLink}
                    to={`/catalogo?cat=${encodeURIComponent(c.cat)}`}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      height: "100%",
                      textDecoration: "none",
                      color: "inherit",
                      display: "block",
                      transition:
                        "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: 3,
                        borderColor: "rgba(0,0,0,0.18)",
                      },
                    }}
                  >
                    <Stack spacing={0.75}>
                      <Typography fontWeight={950} sx={{ lineHeight: 1.2 }}>
                        {c.name}
                      </Typography>

                      <Typography color="text.secondary" variant="body2">
                        {c.hint}
                      </Typography>

                      <Box sx={{ pt: 0.5 }}>
                        <Chip
                          size="small"
                          label="Ver productos"
                          clickable={false}
                          sx={{ fontWeight: 800 }}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Container>
      )}

      {/* DESTACADOS */}
      {!isStaff && (
        <Container sx={{ pb: 4 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h5" fontWeight={950}>
                Destacados
              </Typography>
              <Typography color="text.secondary">
                Ofertas y productos nuevos para que decidas rápido.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip icon={<BoltIcon />} label="Ofertas" variant="outlined" />
              <Chip icon={<NewReleasesIcon />} label="Nuevos" variant="outlined" />
              <Button
                variant="contained"
                component={RouterLink}
                to="/catalogo"
                sx={{ fontWeight: 900 }}
              >
                Ver todo
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            {featured.map((p) => (
              <Grid key={p.id} item xs={12} sm={6} md={4}>
                <ProductCard {...p} stock={p.stock} status={p.status} />
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* CONFIANZA + CÓMO FUNCIONA + CTA FINAL */}
      {!isStaff && (
        <Container sx={{ pb: 5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                <Typography variant="h6" fontWeight={950} sx={{ mb: 1 }}>
                  Confianza y soporte
                </Typography>

                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PaymentsIcon />
                    <Typography fontWeight={900}>Pagos y comprobantes</Typography>
                  </Stack>
                  <Typography color="text.secondary" variant="body2">
                    Flujo de pago simulado. En producción se integra con pasarela y emisión.
                  </Typography>

                  <Divider />

                  <Stack direction="row" spacing={1} alignItems="center">
                    <ReplayIcon />
                    <Typography fontWeight={900}>Devoluciones claras</Typography>
                  </Stack>
                  <Typography color="text.secondary" variant="body2">
                    Reglas de devolución visibles en Políticas (demo).
                  </Typography>

                  <Divider />

                  <Stack direction="row" spacing={1} alignItems="center">
                    <SupportAgentIcon />
                    <Typography fontWeight={900}>Atención</Typography>
                  </Stack>
                  <Typography color="text.secondary" variant="body2">
                    Contacto directo desde la página de Contacto.
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to="/policies"
                      sx={{ fontWeight: 900 }}
                    >
                      Ver políticas
                    </Button>
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to="/contact"
                      sx={{ fontWeight: 900 }}
                    >
                      Contacto
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                <Typography variant="h6" fontWeight={950} sx={{ mb: 1 }}>
                  Cómo funciona
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                      <Typography fontWeight={900}>1) Elige en el catálogo</Typography>
                      <Typography color="text.secondary" variant="body2">
                        Filtra por precio, estado y stock para decidir rápido.
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                      <Typography fontWeight={900}>2) Agrega al carrito</Typography>
                      <Typography color="text.secondary" variant="body2">
                        El sistema bloquea cantidades mayores al stock disponible.
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                      <Typography fontWeight={900}>3) Checkout y seguimiento</Typography>
                      <Typography color="text.secondary" variant="body2">
                        Generas tu orden y la sigues desde “Mis pedidos”.
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/catalogo"
                  sx={{ mt: 2, fontWeight: 950 }}
                  fullWidth
                >
                  Empezar compra
                </Button>
              </Paper>
            </Grid>
          </Grid>

          <Paper
            sx={{
              mt: 2,
              p: 2.5,
              borderRadius: 3,
              bgcolor: "grey.50",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
            >
              <Box>
                <Typography fontWeight={950}>¿Listo para comprar?</Typography>
                <Typography color="text.secondary" variant="body2">
                  Entra al catálogo y revisa ofertas y nuevos ingresos.
                </Typography>
              </Box>

              <Button
                variant="contained"
                component={RouterLink}
                to="/catalogo"
                sx={{ fontWeight: 950 }}
              >
                Ir al catálogo
              </Button>
            </Stack>
          </Paper>
        </Container>
      )}
    </Box>
  );
}
// Nota: Página de inicio que muestra un hero, beneficios, categorías, productos destacados y secciones informativas para usuarios y personal interno
