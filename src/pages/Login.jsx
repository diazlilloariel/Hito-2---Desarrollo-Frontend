import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { ferretexApi, normalizeRole } from "../shared/api/ferretexApi.js";

export default function Login() {
  const { actions } = useApp();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await ferretexApi.login({ email, password });
      // data: { token, user: { id, name, email, role } }
      const token = data?.token;
      const u = data?.user;

      if (!token || !u) throw new Error("Respuesta inválida del servidor.");

      const role = normalizeRole(u.role);

      // Guardamos token para próximas pantallas (sin tocar AppContext si no quieres)
      localStorage.setItem("ferretex:token", token);

      // Mantengo tu contrato actual: actions.login({name,email,role})
      actions.login({
        id: u.id,
        name: u.name,
        email: u.email,
        role,
        token, // no rompe; queda disponible para futuro
      });

      nav(role === "customer" ? "/profile" : "/staff");
    } catch (err) {
      setError(err?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 4, maxWidth: 560 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={900} mb={2}>
          Iniciar sesión
        </Typography>

        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            variant="contained"
            sx={{ fontWeight: 800 }}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
