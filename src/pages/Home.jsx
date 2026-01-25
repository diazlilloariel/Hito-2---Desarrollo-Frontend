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
  Alert,
  Skeleton,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import BoltIcon from "@mui/icons-material/Bolt";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReplayIcon from "@mui/icons-material/Replay";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import ProductCard from "../shared/components/ProductCard.jsx";
import { ferretexApi } from "../shared/api/ferretexApi.js";

function normalizeProduct(p) {
  return {
    ...p,
    id: p.id,
    name: p.name ?? p.nombre ?? "Producto",
    price: Number(p.price ?? p.precio ?? 0),
    image: p.image ?? p.imagen_url ?? p.image_url ?? "",
    status: p.status ?? "none",
    category: p.category ?? p.categoria ?? p.cat ?? p.category_name ?? "general",
    stock: Number(p.stock ?? 0),
  };
}

export default function Home() {
  const { state } = useApp();
  const role = state?.auth?.user?.role ?? "customer";
  const isStaff = role === "staff" || role === "manager";

  const priceOverrides = useMemo(
    () => state?.catalog?.prices ?? {},
    [state?.catalog?.prices]
  );

  const categories = useMemo(
    () => [
      { name: "Herramientas", cat: "herramientas", hint: "Taladros, kits, accesorios" },
      { name: "Fijaciones", cat: "fijaciones", hint: "Tornillos, tarugos, pernos" },
      { name: "Seguridad", cat: "seguridad", hint: "Guantes, lentes, EPP" },
      { name: "Electricidad", cat: "electricidad", hint: "Cables, enchufes, testers" },
    ],
    []
  );

  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState("");
  const [apiProducts, setApiProducts] = useState([]);

  useEffect(() => {
    const ac = new AbortController();

    // Staff/manager: no cargamos marketing ni destacados
    if (isStaff) {
      setLoadingFeatured(false);
      setFeaturedError("");
      setApiProducts([]);
      return () => ac.abort();
    }

    const run = async () => {
      setLoadingFeatured(true);
      setFeaturedError("");

      try {
        const list = await ferretexApi.getProducts({ sort: "price_asc" });

        const normalized = (Array.isArray(list) ? list : [])
          .map(normalizeProduct)
          .map((p) => ({
            ...p,
            price: priceOverrides[p.id] ?? p.price,
          }));

        if (!ac.signal.aborted) setApiProducts(normalized);
      } catch (e) {
        if (!ac.signal.aborted) {
          setFeaturedError(e?.message || "No se pudieron cargar destacados desde la API.");
          setApiProducts([]);
        }
      } finally {
        if (!ac.signal.aborted) setLoadingFeatured(false);
      }
    };

    run();
    return () => ac.abort();
  }, [isStaff, priceOverrides]);

  const featured = useMemo(() => {
    if (!Array.isArray(apiProducts) || apiProducts.length === 0) return [];

    const priority = apiProducts
      .filter((x) => x.status === "offer" || x.status === "new")
      .slice(0, 3);

    if (priority.length >= 3) return priority;

    const rest = apiProducts.filter((x) => !priority.some((y) => y.id === x.id));
    return [...priority, ...rest].slice(0, 3);
  }, [apiProducts]);

  return (
    <Box>
      {/* HERO */}
      <Box sx={{ bgcolor: "primary.main", color: "#fff", py: { xs: 5, md: 7 } }}>
        <Container>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={1.5}>
                <Typography variant="h3" fontWeight={950} sx={{ lineHeight: 1.1 }}>
                  Ferretex
                </Typography>

                <Typography sx={{ opacity: 0.9, maxWidth: 620 }}>
                  {isStaff
                    ? "Control operativo de stock y órdenes desde el panel interno."
                    : "Compra herramientas y suministros con retiro en tienda o despacho. Stock real y precios claros."}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                  <Chip
                    icon={<StorefrontIcon />}
                    label="Retiro en tienda"
                    sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff" }}
                  />
                  <Chip
                    icon={<LocalShippingIcon />}
                    label="Despacho"
                    sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff" }}
                  />
                  <Chip
                    icon={<VerifiedUserIcon />}
                    label="Pago seguro"
                    sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff" }}
                  />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 1.5 }}>
                  <Button
                    component={RouterLink}
                    to="/catalog"
                    variant="contained"
                    color="secondary"
                    size="large"
                    sx={{ fontWeight: 800 }}
                  >
                    Ver catálogo
                  </Button>

                  {!isStaff ? (
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="outlined"
                      color="inherit"
                      size="large"
                      sx={{ fontWeight: 800, borderColor: "rgba(255,255,255,0.6)" }}
                    >
                      Ingresar
                    </Button>
                  ) : (
                    <Button
                      component={RouterLink}
                      to="/staff"
                      variant="outlined"
                      color="inherit"
                      size="large"
                      sx={{ fontWeight: 800, borderColor: "rgba(255,255,255,0.6)" }}
                    >
                      Ir al panel
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 4,
                  bgcolor: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.22)",
                }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="h6" fontWeight={900}>
                    Beneficios
                  </Typography>

                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <BoltIcon />
                      <Typography>Stock visible y actualizado</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <PaymentsIcon />
                      <Typography>Pago online o al retirar</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <ReplayIcon />
                      <Typography>Devoluciones según políticas</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <SupportAgentIcon />
                      <Typography>Soporte y atención</Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Solo clientes */}
      {!isStaff && (
        <Container sx={{ py: 5 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ mb: 2 }}
          >
            <Stack>
              <Typography variant="h5" fontWeight={950}>
                Destacados
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Ofertas y novedades seleccionadas desde el catálogo.
              </Typography>
            </Stack>

            <Button component={RouterLink} to="/catalog" variant="text" sx={{ fontWeight: 900 }}>
              Ver todo
            </Button>
          </Stack>

          {featuredError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {featuredError}
            </Alert>
          )}

          {loadingFeatured && featured.length === 0 ? (
            <Grid container spacing={2}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Grid key={i} item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2, borderRadius: 3 }}>
                    <Skeleton variant="rectangular" height={160} />
                    <Skeleton sx={{ mt: 1 }} />
                    <Skeleton width="60%" />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <>
              <Grid container spacing={2}>
                {featured.map((p) => (
                  <Grid key={p.id} item xs={12} sm={6} md={4}>
                    <ProductCard {...p} />
                  </Grid>
                ))}
              </Grid>

              {!loadingFeatured && featured.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No hay productos para mostrar en destacados.
                </Alert>
              )}
            </>
          )}

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" fontWeight={950} sx={{ mb: 1.5 }}>
            Categorías
          </Typography>

          <Grid container spacing={2}>
            {categories.map((c) => (
              <Grid key={c.cat} item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, borderRadius: 3 }}>
                  <Typography fontWeight={900}>{c.name}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.25 }}>
                    {c.hint}
                  </Typography>

                  <Button
                    component={RouterLink}
                    to={`/catalog?cat=${encodeURIComponent(c.cat)}`}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1.5, fontWeight: 800 }}
                  >
                    Explorar
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* CONFIANZA + CÓMO FUNCIONA */}
      {!isStaff && (
        <Container sx={{ pb: 5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                <Typography variant="h6" fontWeight={950} sx={{ mb: 1 }}>
                  Cómo funciona
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    1) Elige productos en el catálogo y revisa stock disponible.
                  </Typography>
                  <Typography variant="body2">
                    2) Paga online o selecciona pago en tienda al retirar.
                  </Typography>
                  <Typography variant="body2">
                    3) Retira en tienda o recibe despacho según disponibilidad.
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                <Typography variant="h6" fontWeight={950} sx={{ mb: 1 }}>
                  Transparencia operacional
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    Precios y stock vienen desde backend + base de datos.
                  </Typography>
                  <Typography variant="body2">
                    Órdenes y estados se gestionan con trazabilidad.
                  </Typography>
                  <Typography variant="body2">
                    Reglas de devolución visibles en Políticas.
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    component={RouterLink}
                    to="/policies"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 900 }}
                  >
                    Ver políticas
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/contact"
                    variant="contained"
                    size="small"
                    sx={{ fontWeight: 900 }}
                  >
                    Contacto
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      )}
    </Box>
  );
}
