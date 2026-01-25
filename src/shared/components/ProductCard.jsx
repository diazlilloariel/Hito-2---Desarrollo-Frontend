import { useMemo, useState } from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  Button,
  Stack,
  Chip,
  Divider,
  Box,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useApp } from "../../context/AppContext.jsx";

function stockChip(stock) {
  const s = Number(stock ?? 0);
  if (s <= 0) return { label: "SIN STOCK", color: "error" };
  if (s <= 5) return { label: "BAJO", color: "error" };
  if (s <= 15) return { label: "ATENCIÓN", color: "warning" };
  return { label: "OK", color: "success" };
}

export default function ProductCard({ id, name, price, image, stock, status }) {
  const { state, actions } = useApp();
  const [added, setAdded] = useState(false);

  const role = state.auth.user?.role ?? "customer";
  const isStaff = role === "staff" || role === "manager";

  const priceCLP = useMemo(
    () => `$${Number(price).toLocaleString("es-CL")}`,
    [price]
  );

  const s = Number(stock ?? 0);
  const outOfStock = !isStaff && s <= 0;

  const showMarketing = !isStaff && (status === "offer" || status === "new");
  const marketingLabel = status === "offer" ? "OFERTA" : "NUEVO";
  const marketingColor = status === "offer" ? "secondary" : "success";

  const stockInfo = useMemo(() => stockChip(stock), [stock]);

  const handleAdd = () => {
    actions.addToCart({
      id,
      name,
      price: Number(price),
      stock: Number(stock ?? 0),
      image: image || "",
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        transition: "transform 150ms ease, box-shadow 150ms ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
      }}
    >
      <CardMedia component="img" height="190" image={image} alt={name} />

      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Typography fontWeight={900} sx={{ lineHeight: 1.2 }}>
              {name}
            </Typography>

            <Box>
              {isStaff ? (
                <Chip size="small" label={stockInfo.label} color={stockInfo.color} />
              ) : showMarketing ? (
                <Chip size="small" label={marketingLabel} color={marketingColor} />
              ) : null}
            </Box>
          </Stack>

          <Divider />

          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography variant="body2" color="text.secondary">
              Precio
            </Typography>
            <Typography variant="h6" fontWeight={900}>
              {priceCLP}
            </Typography>
          </Stack>

          {isStaff && (
            <Typography variant="body2" color="text.secondary">
              Stock: <b>{Number(stock ?? 0)}</b>
            </Typography>
          )}
        </Stack>
      </CardContent>

      {!isStaff && (
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant={added ? "outlined" : "contained"}
            onClick={handleAdd}
            disabled={outOfStock}
            startIcon={added ? <CheckCircleIcon /> : <AddShoppingCartIcon />}
            sx={{ fontWeight: 800 }}
          >
            {outOfStock ? "Sin stock" : added ? "Agregado" : "Agregar al carrito"}
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
