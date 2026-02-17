import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const role = state.auth.user?.role ?? "customer";
  const isStaff = role === "staff" || role === "manager";

  const s = Number(stock ?? 0);
  const outOfStock = !isStaff && s <= 0;

  const priceCLP = useMemo(
    () => `$${Number(price ?? 0).toLocaleString("es-CL")}`,
    [price],
  );

  const showMarketing = !isStaff && (status === "offer" || status === "new");
  const marketingLabel = status === "offer" ? "OFERTA" : "NUEVO";
  const marketingColor = status === "offer" ? "secondary" : "success";

  const stockInfo = useMemo(() => stockChip(s), [s]);

  const goDetail = () => navigate(`/productos/${id}`);

  const handleAdd = () => {
    actions.addToCartQty(
      {
        id,
        name,
        price: Number(price ?? 0),
        stock: s,
        image: image || "",
      },
      1,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  };

  return (
    <Card
      sx={{
        // ✅ tamaño estándar por breakpoint
        height: { xs: 420, sm: 440, md: 460 },
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        overflow: "hidden",
        transition: "transform 150ms ease, box-shadow 150ms ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
      }}
    >
      {/* ✅ imagen consistente (alto fijo, no deforma por ratio) */}
      <Box
        sx={{
          height: 190,
          cursor: "pointer",
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={goDetail}
        role="button"
        tabIndex={0}
      >
        <CardMedia
          component="img"
          image={image}
          alt={name}
          sx={{
            height: "100%",
            width: "100%",
            objectFit: "cover",
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={1}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            gap={1}
          >
            {/* ✅ clamp 2 líneas: el nombre no cambia la altura */}
            <Typography
              fontWeight={900}
              sx={{
                lineHeight: 1.2,
                cursor: "pointer",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
              title={name}
              onClick={goDetail}
            >
              {name}
            </Typography>

            <Box sx={{ flexShrink: 0 }}>
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
              Stock: <b>{s}</b>
            </Typography>
          )}
        </Stack>
      </CardContent>

      {/* ✅ acciones alineadas abajo siempre */}
      <CardActions sx={{ mt: "auto", p: 2, pt: 0 }}>
        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={goDetail}
            startIcon={<InfoOutlinedIcon />}
            sx={{ fontWeight: 800 }}
          >
            Ver detalle
          </Button>

          {!isStaff && (
            <Button
              fullWidth
              variant={added ? "outlined" : "contained"}
              onClick={handleAdd}
              disabled={outOfStock}
              startIcon={added ? <CheckCircleIcon /> : <AddShoppingCartIcon />}
              sx={{ fontWeight: 800 }}
            >
              {outOfStock ? "Sin stock" : added ? "Agregado" : "Agregar"}
            </Button>
          )}
        </Stack>
      </CardActions>
    </Card>
  );
}
