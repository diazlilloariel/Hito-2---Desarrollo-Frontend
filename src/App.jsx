import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline, Container, Box } from "@mui/material";
import { theme } from "./shared/theme/theme.js";
import { AppProvider } from "./context/AppContext.jsx";
import AppNavbar from "./shared/components/AppNavbar.jsx";
import AppRouter from "./app/router/AppRouter.jsx";
import AppFooter from "./shared/components/AppFooter.jsx";
import AppSnackbar from "./shared/components/AppSnackbar.jsx";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <BrowserRouter>
          <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <AppNavbar />

            <Box component="main" sx={{ flexGrow: 1 }}>
              <Container disableGutters maxWidth={false}>
                <AppRouter />
              </Container>
            </Box>

            <AppFooter />
            <AppSnackbar />
          </Box>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}
// Nota: Componente raíz de la aplicación que configura el tema, el contexto y la estructura principal de la interfaz de usuario
