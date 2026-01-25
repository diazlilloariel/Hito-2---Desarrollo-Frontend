import {
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Paper,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Skeleton,
  Box,
  InputAdornment,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../shared/components/ProductCard.jsx";
import { useApp } from "../context/AppContext.jsx";
import { ferretexApi } from "../shared/api/ferretexApi.js";

const EMPTY_OBJ = Object.freeze({});

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeDigitsOnly(v) {
  return String(v ?? "").replace(/[^\d]/g, "");
}

function normalizeProduct(p) {
  return {
    ...p,
    name: p.name ?? p.nombre ?? "Producto",
    price: Number(p.price ?? p.precio ?? 0),
    image: p.image ?? p.imagen_url ?? p.image_url ?? "",
    status: p.status ?? "none",
    category: p.category ?? p.categoria ?? p.cat ?? p.category_name ?? "general",
    stock: Number(p.stock ?? p.stock_actual ?? p.stockActual ?? 0),
  };
}

export default function Catalog() {
  const { state } = useApp();

  const priceOverrides = useMemo(
    () => state?.catalog?.prices ?? EMPTY_OBJ,
    [state?.catalog?.prices]
  );

  const [searchParams, setSearchParams] = useSearchParams();

  // Query params
  const qParam = searchParams.get("q") ?? "";
  const catParam = searchParams.get("cat") ?? "";
  const statusParam = searchParams.get("status") ?? "";
  const sortParam = searchParams.get("sort") ?? "";
  const inStockParam = searchParams.get("inStock") ?? "false";
  const minPriceParam = searchParams.get("minPrice") ?? "";
  const maxPriceParam = searchParams.get("maxPrice") ?? "";

  // Local UI state (inputs)
  const [q, setQ] = useState(qParam);
  const [cat, setCat] = useState(catParam);
  const [status, setStatus] = useState(statusParam);
  const [sort, setSort] = useState(sortParam);
  const [inStock, setInStock] = useState(inStockParam === "true");
  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);

  // Applied filters
  const [minPriceApplied, setMinPriceApplied] = useState(minPriceParam);
  const [maxPriceApplied, setMaxPriceApplied] = useState(maxPriceParam);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

  // Sync query params -> inputs
  useEffect(() => {
    setQ(qParam);
    setCat(catParam);
    setStatus(statusParam);
    setSort(sortParam);
    setInStock(inStockParam === "true");
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
    setMinPriceApplied(minPriceParam);
    setMaxPriceApplied(maxPriceParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    qParam,
    catParam,
    statusParam,
    sortParam,
    inStockParam,
    minPriceParam,
    maxPriceParam,
  ]);

  // Fetch
  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const filters = {
          q: isNonEmptyString(qParam) ? qParam : undefined,
          cat: isNonEmptyString(catParam) ? catParam : undefined,
          status: isNonEmptyString(statusParam) ? statusParam : undefined,
          sort: isNonEmptyString(sortParam) ? sortParam : undefined,
          inStock: inStock ? "true" : undefined,
          minPrice: isNonEmptyString(minPriceApplied) ? minPriceApplied : undefined,
          maxPrice: isNonEmptyString(maxPriceApplied) ? maxPriceApplied : undefined,
        };

        const list = await ferretexApi.getProducts(filters);
        if (!alive) return;

        const normalized = (Array.isArray(list) ? list : []).map(normalizeProduct);

        const enriched = normalized.map((p) => ({
          ...p,
          price: priceOverrides[p.id] ?? p.price,
        }));

        setProducts(enriched);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "No se pudo cargar el catálogo.");
        setProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [
    qParam,
    catParam,
    statusParam,
    sortParam,
    inStock,
    minPriceApplied,
    maxPriceApplied,
    priceOverrides,
  ]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (isNonEmptyString(qParam)) chips.push({ key: "q", label: `Buscar: ${qParam}` });
    if (isNonEmptyString(catParam)) chips.push({ key: "cat", label: `Categoría: ${catParam}` });
    if (isNonEmptyString(statusParam))
      chips.push({ key: "status", label: `Estado: ${statusParam}` });
    if (isNonEmptyString(sortParam)) chips.push({ key: "sort", label: `Orden: ${sortParam}` });
    if (inStock) chips.push({ key: "inStock", label: "Solo con stock" });
    if (isNonEmptyString(minPriceApplied))
      chips.push({ key: "minPrice", label: `Min: ${minPriceApplied}` });
    if (isNonEmptyString(maxPriceApplied))
      chips.push({ key: "maxPrice", label: `Max: ${maxPriceApplied}` });
    return chips;
  }, [qParam, catParam, statusParam, sortParam, inStock, minPriceApplied, maxPriceApplied]);

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams);

    const qV = q.trim();
    const catV = cat.trim();
    const statusV = status.trim();
    const sortV = sort.trim();

    const minV = normalizeDigitsOnly(minPrice);
    const maxV = normalizeDigitsOnly(maxPrice);

    if (isNonEmptyString(qV)) next.set("q", qV);
    else next.delete("q");

    if (isNonEmptyString(catV)) next.set("cat", catV);
    else next.delete("cat");

    if (isNonEmptyString(statusV)) next.set("status", statusV);
    else next.delete("status");

    if (isNonEmptyString(sortV)) next.set("sort", sortV);
    else next.delete("sort");

    if (inStock) next.set("inStock", "true");
    else next.delete("inStock");

    if (isNonEmptyString(minV)) next.set("minPrice", minV);
    else next.delete("minPrice");

    if (isNonEmptyString(maxV)) next.set("maxPrice", maxV);
    else next.delete("maxPrice");

    setMinPriceApplied(minV);
    setMaxPriceApplied(maxV);

    setSearchParams(next);
  };

  const clearFilters = () => {
    setQ("");
    setCat("");
    setStatus("");
    setSort("");
    setInStock(false);
    setMinPrice("");
    setMaxPrice("");
    setMinPriceApplied("");
    setMaxPriceApplied("");
    setSearchParams({});
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={2.25}>
        <Stack>
          <Typography variant="h4" fontWeight={950}>
            Catálogo
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            Productos cargados desde backend + base de datos.
          </Typography>
        </Stack>

        {/* Filters */}
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          {/* Fila 1: buscar + selects (más anchos) */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr 1fr" },
              alignItems: "center",
            }}
          >
            <TextField
              fullWidth
              label="Buscar"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej: taladro, tornillos..."
            />

            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select value={cat} label="Categoría" onChange={(e) => setCat(e.target.value)}>
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="herramientas">herramientas</MenuItem>
                <MenuItem value="fijaciones">fijaciones</MenuItem>
                <MenuItem value="seguridad">seguridad</MenuItem>
                <MenuItem value="electricidad">electricidad</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={status} label="Estado" onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="offer">offer</MenuItem>
                <MenuItem value="new">new</MenuItem>
                <MenuItem value="none">none</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Orden</InputLabel>
              <Select value={sort} label="Orden" onChange={(e) => setSort(e.target.value)}>
                <MenuItem value="">Default</MenuItem>
                <MenuItem value="price_asc">Precio ↑</MenuItem>
                <MenuItem value="price_desc">Precio ↓</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Fila 2: stock + min/max + botones */}
          <Box
            sx={{
              mt: 2,
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
              alignItems: "center",
            }}
          >
            <FormControlLabel
              control={<Switch checked={inStock} onChange={(e) => setInStock(e.target.checked)} />}
              label="Solo con stock"
            />

            <TextField
              fullWidth
              label="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              inputMode="numeric"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />

            <TextField
              fullWidth
              label="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              inputMode="numeric"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />

            <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
              <Button variant="contained" onClick={applyFilters} sx={{ fontWeight: 900 }}>
                Aplicar
              </Button>
              <Button variant="outlined" onClick={clearFilters} sx={{ fontWeight: 900 }}>
                Limpiar
              </Button>
            </Stack>
          </Box>

          {activeChips.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {activeChips.map((c) => (
                  <Chip key={c.key} label={c.label} />
                ))}
              </Stack>
            </>
          )}
        </Paper>

        {/* Results */}
        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(12, 1fr)" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Box key={i} sx={{ gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" } }}>
                <Paper sx={{ p: 2, borderRadius: 3 }}>
                  <Skeleton variant="rectangular" height={150} />
                  <Skeleton sx={{ mt: 1 }} />
                  <Skeleton width="60%" />
                </Paper>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(12, 1fr)" }}>
            {products.map((p) => (
              <Box key={p.id} sx={{ gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" } }}>
                <ProductCard {...p} />
              </Box>
            ))}
          </Box>
        )}

        {!loading && !error && products.length === 0 && (
          <Alert severity="info">No hay productos para los filtros seleccionados.</Alert>
        )}
      </Stack>
    </Container>
  );
}
