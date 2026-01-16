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
} from "@mui/material";
import { useMemo, useState } from "react";
import { products as baseProducts } from "../data/products.js";
import ProductCard from "../shared/components/ProductCard.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function Home() {
  const { state, actions } = useApp();
  const [search, setSearch] = useState("");

  const products = useMemo(() => {
    let p = [...baseProducts];

    // filtro por nombre
    const q = search.trim().toLowerCase();
    if (q) {
      p = p.filter((prod) => prod.name.toLowerCase().includes(q));
    }

    // ordenamiento por precio
    if (state.ui.sort === "price_desc") {
      p.sort((a, b) => b.price - a.price);
    } else {
      p.sort((a, b) => a.price - b.price);
    }

    return p;
  }, [search, state.ui.sort]);

  const hasSearch = search.trim().length > 0;

  return (
    <Container sx={{ py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={900} sx={{ flexGrow: 1 }}>
          Marketplace Ferretex
        </Typography>

        <TextField
          size="small"
          label="Buscar producto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
        />

        {hasSearch && (
          <Button
            variant="outlined"
            onClick={() => setSearch("")}
            sx={{ whiteSpace: "nowrap" }}
          >
            Limpiar
          </Button>
        )}

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Ordenar</InputLabel>
          <Select
            value={state.ui.sort}
            label="Ordenar"
            onChange={(e) => actions.setSort(e.target.value)}
          >
            <MenuItem value="price_asc">Precio: menor a mayor</MenuItem>
            <MenuItem value="price_desc">Precio: mayor a menor</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Resultados */}
      {products.length === 0 ? (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" fontWeight={800}>
            Sin resultados
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {hasSearch
              ? `No encontramos productos con “${search.trim()}”.`
              : "No hay productos disponibles en este momento."}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {products.map((p) => (
            <Grid key={p.id} item xs={12} sm={6} md={4}>
              <ProductCard {...p} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
