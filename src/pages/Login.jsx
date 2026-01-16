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

// Mock silencioso: define roles por email.
// En producción esto lo entregará el backend vía JWT.
function resolveRoleByEmail(email) {
  const e = email.trim().toLowerCase();

  // Ejemplos (ajústalos):
  // - staff: termina en @ferretex.cl
  // - manager: correo específico del encargado
  if (e === "encargado@ferretex.cl") return "manager";
  if (e.endsWith("@ferretex.cl")) return "staff";

  return "customer";
}

export default function Login() {
  const { actions } = useApp();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Mock básico: solo valida que haya algo
    if (!email.trim() || !password.trim()) {
      setError("Completa email y password.");
      return;
    }

    const role = resolveRoleByEmail(email);

    actions.login({
      name: role === "manager" ? "Encargado" : role === "staff" ? "Personal" : "Cliente",
      email,
      role,
    });

    // Redirección silenciosa según rol
    nav(role === "customer" ? "/profile" : "/staff");
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

          <Button type="submit" variant="contained" sx={{ fontWeight: 800 }}>
            Entrar
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
