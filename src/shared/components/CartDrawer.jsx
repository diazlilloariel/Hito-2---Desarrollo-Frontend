import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Divider,
  Button,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useMemo } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { useNavigate } from "react-router-dom";

export default function CartDrawer({ open, onClose }) {
  const { state, actions } = useApp();
  const nav = useNavigate();
  const items = state.cart.items;

  // Stock desde el propio item (inyectado al agregar al carrito)
  const stockById = useMemo(() => {
    const map = {};
    for (const it of items) map[it.id] = Number(it.stock ?? Infinity);
    return map;
  }, [items]);

  const total = useMemo(
    () => items.reduce((acc, x) => acc + Number(x.price) * Number(x.qty), 0),
    [items]
  );

  const inc = (id) => actions.incQty(id);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6" fontWeight={900}>
            Carrito
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {items.length === 0 ? (
          <Typography color="text.secondary">Tu carrito está vacío.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {items.map((x) => {
              const max = stockById[x.id];
              const maxReached = Number.isFinite(max) && x.qty >= max;

              return (
                <Box
                  key={x.id}
                  sx={{
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 2,
                    p: 1.25,
                  }}
                >
                  <Stack spacing={0.75}>
                    <Typography fontWeight={800} sx={{ lineHeight: 1.2 }}>
                      {x.name}
                    </Typography>

                    <Typography color="text.secondary" variant="body2">
                      ${Number(x.price).toLocaleString("es-CL")} c/u
                    </Typography>

                    {Number.isFinite(max) && (
                      <Typography color="text.secondary" variant="caption">
                        Stock: {max}
                      </Typography>
                    )}

                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton size="small" onClick={() => actions.decQty(x.id)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>

                        <Typography fontWeight={900}>{x.qty}</Typography>

                        <Tooltip title={maxReached ? "Stock máximo alcanzado" : "Aumentar"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => inc(x.id)}
                              disabled={maxReached}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={900}>
                          ${Number(x.price * x.qty).toLocaleString("es-CL")}
                        </Typography>
                        <IconButton size="small" onClick={() => actions.removeFromCart(x.id)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}

            <Divider />

            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary">Total</Typography>
                <Typography variant="h6" fontWeight={900}>
                  ${Number(total).toLocaleString("es-CL")}
                </Typography>
              </Stack>

              <Button
                variant="contained"
                sx={{ fontWeight: 900 }}
                onClick={() => {
                  onClose();
                  nav("/checkout");
                }}
              >
                Ir a pagar
              </Button>

              <Button variant="outlined" onClick={actions.clearCart} sx={{ fontWeight: 800 }}>
                Vaciar carrito
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
