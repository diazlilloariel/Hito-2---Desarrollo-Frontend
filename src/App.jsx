import { BrowserRouter } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Paper,
  Divider,
} from "@mui/material";
import { useMemo, useState } from "react";

import { theme } from "./shared/theme/theme.js";
import { AppProvider } from "./context/AppContext.jsx";
import AppNavbar from "./shared/components/AppNavbar.jsx";
import AppRouter from "./app/router/AppRouter.jsx";
import AppFooter from "./shared/components/AppFooter.jsx";
import AppSnackbar from "./shared/components/AppSnackbar.jsx";

function getApiBase() {
  const raw = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return String(raw).replace(/\/+$/, "");
}

function ChatRagFab() {
  const API_BASE = useMemo(() => getApiBase(), []);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [lastMatches, setLastMatches] = useState([]);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hola 👋 ¿Qué estás buscando hoy? Puedes escribir nombre, SKU o categoría. Ej: “guante talla 9” o “FER-GUA-910”.",
    },
  ]);

  const send = async () => {
    const text = String(message || "").trim();
    if (!text || loading) return;

    setError("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || `Error HTTP ${res.status}`);
      }

      const reply = String(data?.reply || "No tengo respuesta para eso.");
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

      const matches = Array.isArray(data?.matches) ? data.matches : [];
      setLastMatches(matches);
    } catch (_e) {
      setError(
        "No pude conectar con el backend. Si estás en Render free, puede estar dormido: reintenta en 10–20s.",
      );
    } finally {
      setLoading(false);
    }
  };

  const useMatch = (m) => {
    const next = String(m?.sku || m?.title || "").trim();
    if (!next) return;
    setMessage(next);
  };

  return (
    <>
      <Fab
        onClick={() => setOpen(true)}
        variant="extended"
        sx={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 1500,
        }}
      >
        Chat
      </Fab>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Asistente Ferretex</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.25}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                height: 320,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {messages.map((m, idx) => (
                <Box
                  key={idx}
                  sx={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    p: 1,
                    borderRadius: 2,
                    bgcolor:
                      m.role === "user" ? "action.selected" : "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <Typography variant="body2">{m.text}</Typography>
                </Box>
              ))}
            </Paper>

            {Array.isArray(lastMatches) && lastMatches.length > 0 ? (
              <>
                <Divider />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Te recomiendo estas
                </Typography>

                <Stack spacing={1}>
                  {lastMatches.map((m, i) => (
                    <Paper
                      key={`${m?.id ?? i}`}
                      variant="outlined"
                      sx={{ p: 1.25, borderRadius: 2 }}
                    >
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {m?.idx ? `${m.idx}) ` : ""}
                          {m?.title || "Producto"}
                        </Typography>

                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {m?.sku ? `SKU: ${m.sku}` : "SKU: —"}
                          {m?.category ? ` • Categoría: ${m.category}` : ""}
                        </Typography>

                        {m?.snippet ? (
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {m.snippet}…
                          </Typography>
                        ) : null}

                        <Box sx={{ display: "flex", gap: 1, pt: 0.5 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => useMatch(m)}
                          >
                            Usar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setLastMatches([])}
                          >
                            Ocultar
                          </Button>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </>
            ) : null}

            {error ? (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            ) : null}

            <TextField
              label="Escribe tu consulta"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder='Ej: "guante talla 9"'
              multiline
              minRows={2}
              disabled={loading}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cerrar
          </Button>
          <Button
            onClick={send}
            variant="contained"
            disabled={loading || !message.trim()}
          >
            {loading ? "Buscando..." : "Enviar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <BrowserRouter>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <AppNavbar />

            <Box component="main" sx={{ flexGrow: 1 }}>
              <Container disableGutters maxWidth={false}>
                <AppRouter />
              </Container>
            </Box>

            <AppFooter />
            <AppSnackbar />

            {/* ✅ Chat flotante */}
            <ChatRagFab />
          </Box>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}
// Nota: Componente raíz de la aplicación que configura el tema, el contexto y la estructura principal de la interfaz de usuario
