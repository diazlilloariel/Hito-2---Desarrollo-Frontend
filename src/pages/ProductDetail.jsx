import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  Alert,
  Skeleton,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import ProductCard from "../shared/components/ProductCard.jsx";
import { ferretexApi } from "../shared/api/ferretexApi.js";

function moneyCLP(n) {
  return `$${Number(n).toLocaleString("es-CL")}`;
}

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { state, actions } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [all, setAll] = useState([]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const p = await ferretexApi.getProductById(id);
        const list = await ferretexApi.getProducts(); // para “relacionados”
        if (!alive) return;

        // aplica override local (mock manager) si lo estás usando
        const pFixed = {
          ...p,
          price: state.catalog.prices[p.id] ?? p.price,
        };
        const listFixed = list.map((x) => ({
          ...x,
          price: state.catalog.prices[x.id] ?? x.price,
        }));

        setProduct(pFixed);
        setAll(listFixed);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "No se pudo cargar el producto.");
        setProduct(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [id, state.catalog.prices]);

  const related = useMemo(() => {
    if (!product) return [];
    return all
      .filter((x) => x.id !== product.id)
      .filter((x) => (x.category ?? "general") === (product.category ?? "general"))
      .slice(0, 3);
  }, [all, product]);

  if (loading) {
    return (
      <Container sx={{ py: 3, maxWidth: 1100 }}>
        <Skeleton width={180} height={40} />
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Skeleton variant="rectangular" height={420} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
              <Skeleton height={36} />
              <Skeleton height={36} width="60%" />
              <Skeleton sx={{ mt: 2 }} />
              <Skeleton />
              <Skeleton />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Producto no encontrado."}
        </Alert>
        <Typography variant="h5" fontWeight={900}>
          Producto no encontrado
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          El producto no existe o fue removido.
        </Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => nav("/catalogo")}>
          Volver al catálogo
        </Button>
      </Container>
    );
  }

  const isOffer = product.status === "offer";
  const isNew = product.status === "new";
  const out = Number(product.stock ?? 0) <= 0;

  const add = () => {
    if (out) return;

    const currentQty = state.cart.items.find((x) => x.id === product.id)?.qty ?? 0;
    if (currentQty >= (product.stock ?? 0)) {
      // si tienes actions.notify, úsalo; si no, no hacemos crash
      if (actions.notify) actions.notify("Stock máximo alcanzado en el carrito.", "warning");
      return;
    }

    actions.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
    });

    if (actions.notify) actions.notify("Producto agregado al carrito.", "success");
  };

  return (
    <Container sx={{ py: 3, maxWidth: 1100 }}>
      <Button component={RouterLink} to="/catalogo" variant="outlined">
        Volver al catálogo
      </Button>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Box
              component="img"
              src={product.image}
              alt={product.name}
              sx={{ width: "100%", height: 420, objectFit: "cover" }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {isOffer && <Chip label="EN OFERTA" color="success" variant="filled" />}
                {isNew && <Chip label="NUEVO" color="primary" variant="filled" />}
                <Chip
                  label={out ? "SIN STOCK" : `Stock: ${product.stock}`}
                  color={out ? "error" : product.stock <= 5 ? "warning" : "default"}
                  variant="outlined"
                />
              </Stack>

              <Typography variant="h4" fontWeight={950}>
                {product.name}
              </Typography>

              <Typography variant="h5" fontWeight={950}>
                {moneyCLP(product.price)}
              </Typography>

              <Typography color="text.secondary">
                {product.description ||
                  "Producto de demostración. En producción este texto proviene del backend con ficha técnica y especificaciones."}
              </Typography>

              <Divider />

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  sx={{ fontWeight: 900 }}
                  disabled={out}
                  onClick={add}
                >
                  Agregar al carrito
                </Button>
                <Button variant="outlined" onClick={() => nav("/checkout")}>
                  Ir a pagar
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 1.25 }}>
          Productos relacionados
        </Typography>
        <Grid container spacing={2}>
          {related.map((p) => (
            <Grid key={p.id} item xs={12} sm={6} md={4}>
              <ProductCard {...p} stock={p.stock} status={p.status} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
