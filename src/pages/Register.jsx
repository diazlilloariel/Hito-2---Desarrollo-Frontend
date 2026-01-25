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

export default function Register() {
  const { actions } = useApp();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    setLoading(true);

    try {
      await ferretexApi.register({ name, email, password });

      // Auto-login para UX “producto”
      const data = await ferretexApi.login({ email, password });
      const token = data?.token;
      const u = data?.user;

      if (!token || !u) throw new Error("Registro ok, pero login falló.");

      const role = normalizeRole(u.role);

      localStorage.setItem("ferretex:token", token);

      actions.login({
        id: u.id,
        name: u.name,
        email: u.email,
        role,
        token,
      });

      setOk("Cuenta creada. Redirigiendo...");
      nav("/profile");
    } catch (err) {
      setError(err?.message || "No se pudo registrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 4, maxWidth: 520 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={900} mb={2}>
          Registrarse
        </Typography>

        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          {error && <Alert severity="error">{error}</Alert>}
          {ok && <Alert severity="success">{ok}</Alert>}

          <TextField
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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
            autoComplete="new-password"
            required
          />

          <Button variant="contained" type="submit" disabled={loading} sx={{ fontWeight: 900 }}>
            {loading ? "Creando..." : "Crear cuenta"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
