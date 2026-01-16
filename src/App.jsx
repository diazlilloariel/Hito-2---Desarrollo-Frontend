import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline, Container } from "@mui/material";
import { theme } from "./shared/theme/theme.js";
import { AppProvider } from "./context/AppContext.jsx";
import AppNavbar from "./shared/components/AppNavbar.jsx";
import AppRouter from "./app/router/AppRouter.jsx";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <BrowserRouter>
          <AppNavbar />
          <Container disableGutters maxWidth={false}>
            <AppRouter />
          </Container>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}
