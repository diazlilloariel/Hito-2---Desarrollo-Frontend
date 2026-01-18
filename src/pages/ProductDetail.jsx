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
} from "@mui/material";
import { useMemo } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { products as baseProducts } from "../data/products.js";
import { useApp } from "../context/AppContext.jsx";
import ProductCard from "../shared/components/ProductCard.jsx";

function moneyCLP(n) {
  return `$${Number(n).toLocaleString("es-CL")}`;
}

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { state, actions } = useApp();

  const product = useMemo(() => {
    const p = baseProducts.find((x) => x.id === id);
    if (!p) return null;
    return {
      ...p,
      status: p.status ?? "none",
      price: state.catalog.prices[p.id] ?? p.price,
      stock: Number(p.stock ?? 0),
      description:
        p.description ??
        "Producto de demostración. En producción este texto proviene del backend con ficha técnica y especificaciones.",
    };
  }, [id, state.catalog.prices]);

  const related = useMemo(() => {
    if (!product) return [];
    const list = baseProducts
      .filter((x) => x.id !== product.id)
      .slice(0, 3)
      .map((x) => ({
        ...x,
        status: x.status ?? "none",
        price: state.catalog.prices[x.id] ?? x.price,
        stock: Number(x.stock ?? 0),
      }));
    return list;
  }, [product, state.catalog.prices]);

  if (!product) {
    return (
      <Container sx={{ py: 3 }}>
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
  const out = product.stock <= 0;

  const add = () => {
    if (out) return actions.notify("Sin stock disponible.", "warning");

    const currentQty = state.cart.items.find((x) => x.id === product.id)?.qty ?? 0;
    if (currentQty >= product.stock) {
      return actions.notify("Stock máximo alcanzado en el carrito.", "warning");
    }

    actions.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
    });
    actions.notify("Producto agregado al carrito.", "success");
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

              <Typography color="text.secondary">{product.description}</Typography>

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
// Nota: Página de detalle de producto con opción de agregar al carrito y ver productos relacionados    