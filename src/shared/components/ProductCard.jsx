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
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useApp } from "../../context/AppContext.jsx";

export default function ProductCard({ id, name, price, image }) {
  const { actions } = useApp();
  const [added, setAdded] = useState(false);

  const priceCLP = useMemo(
    () => `$${Number(price).toLocaleString("es-CL")}`,
    [price]
  );

  const handleAdd = () => {
    actions.addToCart({ id, name, price });
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
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 6,
        },
      }}
    >
      <CardMedia component="img" height="190" image={image} alt={name} />

      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Typography fontWeight={900} sx={{ lineHeight: 1.2 }}>
              {name}
            </Typography>

            {/* Badge simple (puedes cambiarlo después por stock/oferta real) */}
            <Chip size="small" label="FERRE" color="secondary" />
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
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant={added ? "outlined" : "contained"}
          onClick={handleAdd}
          startIcon={added ? <CheckCircleIcon /> : <AddShoppingCartIcon />}
          sx={{ fontWeight: 800 }}
        >
          {added ? "Agregado" : "Agregar al carrito"}
        </Button>
      </CardActions>
    </Card>
  );
}
