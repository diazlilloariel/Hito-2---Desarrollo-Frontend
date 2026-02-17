import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { ferretexApi } from "../shared/api/ferretexApi.js";
import { useApp } from "../context/AppContext.jsx";

function stockChip(stock) {
  const s = Number(stock ?? 0);
  if (s <= 0) return { label: "SIN STOCK", color: "error" };
  if (s <= 5) return { label: "BAJO", color: "error" };
  if (s <= 15) return { label: "ATENCIÓN", color: "warning" };
  return { label: "OK", color: "success" };
}

function statusChip(status) {
  const v = String(status ?? "none");
  if (v === "offer") return { label: "OFERTA", color: "secondary" };
  if (v === "new") return { label: "NUEVO", color: "success" };
  return { label: "NORMAL", color: "default" };
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, actions } = useApp();

  const role = state.auth.user?.role ?? "customer";
  const isStaff = role === "staff" || role === "manager";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const p = await ferretexApi.getProductById(id);
        if (!alive) return;
        setProduct(p);
        setQty(1);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "No se pudo cargar el producto");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const priceCLP = useMemo(() => {
    const n = Number(product?.price ?? 0);
    return `$${n.toLocaleString("es-CL")}`;
  }, [product?.price]);

  const stock = Number(product?.stock ?? 0);
  const stockInfo = useMemo(() => stockChip(stock), [stock]);
  const stInfo = useMemo(() => statusChip(product?.status), [product?.status]);

  const canBuy = !isStaff && stock > 0;

  const onQtyChange = (v) => {
    const n = Math.max(1, Math.floor(Number(v || 1)));
    const clamped = Number.isFinite(stock) ? Math.min(n, Math.max(stock, 1)) : n;
    setQty(clamped);
  };

  const handleAdd = () => {
    if (!product) return;

    actions.addToCartQty(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price ?? 0),
        stock: Number(product.stock ?? 0),
        image: product.image || "",
      },
      qty
    );

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1000);
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Box>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Volver
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && err && <Alert severity="error">{err}</Alert>}

        {!loading && !err && product && (
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Box
                  component="img"
                  src={product.image}
                  alt={product.name}
                  sx={{
                    width: "100%",
                    maxHeight: 420,
                    objectFit: "contain",
                    borderRadius: 2,
                    bgcolor: "background.default",
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Stack spacing={1.5}>
                  <Typography variant="h4" fontWeight={900}>
                    {product.name}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={`SKU: ${product.sku || "-"}`} />
                    <Chip label={`Categoría: ${product.category || "-"}`} />
                    <Chip label={`Stock: ${stock}`} color={stockInfo.color} />
                    <Chip label={`Estado: ${stInfo.label}`} color={stInfo.color} />
                  </Stack>

                  <Divider />

                  <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography color="text.secondary">Precio</Typography>
                    <Typography variant="h5" fontWeight={900}>
                      {priceCLP}
                    </Typography>
                  </Stack>

                  <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                    {product.description || "Sin descripción."}
                  </Typography>

                  {!isStaff && (
                    <>
                      <Divider />

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
                        <TextField
                          label="Cantidad"
                          type="number"
                          value={qty}
                          onChange={(e) => onQtyChange(e.target.value)}
                          inputProps={{ min: 1, max: Math.max(stock, 1) }}
                          sx={{ width: { xs: "100%", sm: 160 } }}
                        />

                        <Button
                          fullWidth
                          variant={added ? "outlined" : "contained"}
                          disabled={!canBuy}
                          onClick={handleAdd}
                          startIcon={added ? <CheckCircleIcon /> : <AddShoppingCartIcon />}
                          sx={{ fontWeight: 900 }}
                        >
                          {stock <= 0 ? "Sin stock" : added ? "Agregado" : "Agregar al carrito"}
                        </Button>
                      </Stack>

                      {stock > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Stock disponible: {stock}
                        </Typography>
                      )}
                    </>
                  )}

                  {isStaff && (
                    <Alert severity="info">
                      Vista Staff/Manager: solo lectura. El carrito es solo para cliente.
                    </Alert>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
