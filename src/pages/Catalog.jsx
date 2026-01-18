import {
  Container,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Button,
  Paper,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { products as baseProducts } from "../data/products.js";
import ProductCard from "../shared/components/ProductCard.jsx";
import { useApp } from "../context/AppContext.jsx";

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function parseMaybeNumber(v) {
  if (!isNonEmptyString(v)) return null;
  const n = Number(String(v).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export default function Catalog() {
  const { state, actions } = useApp();
  const [params, setParams] = useSearchParams();

  // URL como fuente de verdad
  const q = params.get("q") ?? "";
  const cat = params.get("cat") ?? "all";
  const status = params.get("status") ?? "all";
  const sort = params.get("sort") ?? state.ui.sort ?? "price_asc";
  const inStock = (params.get("inStock") ?? "false") === "true";
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";

  const updateParams = (patch) => {
    const next = new URLSearchParams(params);

    Object.entries(patch).forEach(([key, value]) => {
      const v = String(value ?? "").trim();

      const shouldDelete =
        v === "" ||
        (key === "cat" && v === "all") ||
        (key === "status" && v === "all") ||
        (key === "inStock" && v === "false") ||
        (key === "sort" && v === "price_asc");

      if (shouldDelete) next.delete(key);
      else next.set(key, v);
    });

    if (patch.sort) actions.setSort(patch.sort);
    setParams(next, { replace: true });
  };

  const products = useMemo(() => {
    let p = baseProducts.map((prod) => ({
      ...prod,
      price: state.catalog.prices[prod.id] ?? prod.price,
      status: prod.status ?? "none",
      category: prod.category ?? "general",
      stock: Number(prod.stock ?? 0),
    }));

    const query = q.trim().toLowerCase();
    if (query) p = p.filter((x) => x.name.toLowerCase().includes(query));

    if (cat !== "all") p = p.filter((x) => (x.category ?? "general") === cat);

    if (status !== "all") p = p.filter((x) => (x.status ?? "none") === status);

    if (inStock) p = p.filter((x) => Number(x.stock ?? 0) > 0);

    const minP = parseMaybeNumber(minPrice);
    const maxP = parseMaybeNumber(maxPrice);

    if (minP != null) p = p.filter((x) => Number(x.price) >= minP);
    if (maxP != null) p = p.filter((x) => Number(x.price) <= maxP);

    if (sort === "price_desc") p.sort((a, b) => b.price - a.price);
    else p.sort((a, b) => a.price - b.price);

    return p;
  }, [q, cat, status, sort, inStock, minPrice, maxPrice, state.catalog.prices]);

  const activeChips = useMemo(() => {
    const chips = [];

    if (q.trim())
      chips.push({
        key: "q",
        label: `Buscar: ${q.trim()}`,
        onDelete: () => updateParams({ q: "" }),
      });

    if (cat !== "all") {
      const map = {
        herramientas: "Herramientas",
        fijaciones: "Fijaciones",
        seguridad: "Seguridad",
        electricidad: "Electricidad",
      };
      chips.push({
        key: "cat",
        label: `Categoría: ${map[cat] ?? cat}`,
        onDelete: () => updateParams({ cat: "all" }),
      });
    }

    if (status !== "all") {
      chips.push({
        key: "status",
        label: status === "offer" ? "Estado: Ofertas" : "Estado: Nuevos",
        onDelete: () => updateParams({ status: "all" }),
      });
    }

    if (inStock)
      chips.push({
        key: "inStock",
        label: "Solo con stock",
        onDelete: () => updateParams({ inStock: "false" }),
      });

    if (isNonEmptyString(minPrice))
      chips.push({
        key: "minPrice",
        label: `Mín: $${String(minPrice).replace(/[^\d]/g, "")}`,
        onDelete: () => updateParams({ minPrice: "" }),
      });

    if (isNonEmptyString(maxPrice))
      chips.push({
        key: "maxPrice",
        label: `Máx: $${String(maxPrice).replace(/[^\d]/g, "")}`,
        onDelete: () => updateParams({ maxPrice: "" }),
      });

    if (sort !== "price_asc")
      chips.push({
        key: "sort",
        label: "Orden: mayor a menor",
        onDelete: () => updateParams({ sort: "price_asc" }),
      });

    return chips;
  }, [q, cat, status, inStock, minPrice, maxPrice, sort]);

  const hasAnyFilter = activeChips.length > 0;

  return (
    <Container sx={{ py: 3 }}>
      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
        <Stack spacing={1.25}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Typography variant="h5" fontWeight={900} sx={{ flexGrow: 1 }}>
              Catálogo
            </Typography>

            <TextField
              size="small"
              label="Buscar producto"
              value={q}
              onChange={(e) => updateParams({ q: e.target.value })}
              sx={{ minWidth: 260 }}
            />

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={cat}
                label="Categoría"
                onChange={(e) => updateParams({ cat: e.target.value })}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="herramientas">Herramientas</MenuItem>
                <MenuItem value="fijaciones">Fijaciones</MenuItem>
                <MenuItem value="seguridad">Seguridad</MenuItem>
                <MenuItem value="electricidad">Electricidad</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={status}
                label="Estado"
                onChange={(e) => updateParams({ status: e.target.value })}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="offer">Ofertas</MenuItem>
                <MenuItem value="new">Nuevos</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Ordenar</InputLabel>
              <Select
                value={sort}
                label="Ordenar"
                onChange={(e) => updateParams({ sort: e.target.value })}
              >
                <MenuItem value="price_asc">Precio: menor a mayor</MenuItem>
                <MenuItem value="price_desc">Precio: mayor a menor</MenuItem>
              </Select>
            </FormControl>

            {hasAnyFilter && (
              <Button
                variant="outlined"
                onClick={() => {
                  setParams(new URLSearchParams(), { replace: true });
                  actions.setSort("price_asc");
                }}
                sx={{ whiteSpace: "nowrap" }}
              >
                Limpiar
              </Button>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={inStock}
                  onChange={(e) =>
                    updateParams({ inStock: e.target.checked ? "true" : "false" })
                  }
                />
              }
              label="Solo con stock"
            />

            <TextField
              size="small"
              label="Precio mín."
              value={minPrice}
              onChange={(e) => updateParams({ minPrice: e.target.value })}
              sx={{ width: 140 }}
              inputProps={{ inputMode: "numeric" }}
            />

            <TextField
              size="small"
              label="Precio máx."
              value={maxPrice}
              onChange={(e) => updateParams({ maxPrice: e.target.value })}
              sx={{ width: 140 }}
              inputProps={{ inputMode: "numeric" }}
            />

            <Chip size="small" label={`Productos: ${products.length}`} />
          </Box>

          {hasAnyFilter && (
            <>
              <Divider />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {activeChips.map((c) => (
                  <Chip
                    key={c.key}
                    label={c.label}
                    onDelete={c.onDelete}
                    variant="outlined"
                    sx={{ fontWeight: 800 }}
                  />
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </Paper>

      {products.length === 0 ? (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" fontWeight={800}>
            Sin resultados
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Ajusta filtros o limpia la búsqueda.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {products.map((p) => (
            <Grid key={p.id} item xs={12} sm={6} md={4}>
              <ProductCard {...p} stock={p.stock} status={p.status} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
// Nota: Página de catálogo que permite buscar, filtrar y ordenar productos disponibles
