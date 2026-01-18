import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  Badge,
  Chip,
  IconButton,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import CartDrawer from "./CartDrawer.jsx";

export default function AppNavbar() {
  const { state, actions } = useApp();

  const isAuth = state.auth.isAuth;
  const role = state.auth.user?.role ?? "customer";
  const isStaff = role === "staff" || role === "manager";

  const cartCount = state.cart.items.reduce((acc, x) => acc + x.qty, 0);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <AppBar
        position="sticky"
        color="default"
        sx={{
          bgcolor: isStaff ? "#1976d2" : "primary.main",
          color: "#fff",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              component={RouterLink}
              to="/"
              variant="h6"
              sx={{ color: "inherit", textDecoration: "none", fontWeight: 900 }}
            >
              Ferretex
            </Typography>

            {isStaff && (
              <Chip
                size="small"
                label="Modo interno"
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  fontWeight: 700,
                }}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {!isStaff && (
              <>
                <Button color="inherit" component={RouterLink} to="/catalogo">
                  Catálogo
                </Button>
                <Button color="inherit" component={RouterLink} to="/contact">
                  Contacto
                </Button>
              </>
            )}

            {!isStaff && (
              <IconButton color="inherit" onClick={() => setCartOpen(true)}>
                <Badge badgeContent={cartCount} color="secondary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            )}

            {!isAuth ? (
              <>
                <Button color="inherit" component={RouterLink} to="/login">
                  Iniciar sesión
                </Button>
                <Button color="inherit" component={RouterLink} to="/register">
                  Registrarse
                </Button>
              </>
            ) : (
              <>
                {isStaff ? (
                  <Button color="inherit" component={RouterLink} to="/staff">
                    Panel interno
                  </Button>
                ) : (
                  <>
                    <Button color="inherit" component={RouterLink} to="/orders">
                      Mis pedidos
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/profile">
                      Mi perfil
                    </Button>
                  </>
                )}

                <Button color="inherit" onClick={actions.logout}>
                  Cerrar sesión
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {!isStaff && (
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      )}
    </>
  );
}
// Nota: Componente de barra de navegación que muestra enlaces según el estado de autenticación y rol del usuario