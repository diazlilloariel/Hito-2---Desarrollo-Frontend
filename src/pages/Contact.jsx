import {
  Container,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Divider,
} from "@mui/material";
import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";

export default function Contact() {
  const { actions } = useApp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const canSend = name.trim() && email.trim() && msg.trim();

  const send = () => {
    actions.notify("Mensaje enviado (simulado).", "success");
    setName("");
    setEmail("");
    setMsg("");
  };

  return (
    <Container sx={{ py: 3, maxWidth: 900 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={950}>
            Contacto
          </Typography>
          <Typography color="text.secondary">
            Formulario de demostración. En producción se integra con correo/CRM.
          </Typography>

          <Divider />

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
            required
          />

          <TextField
            label="Mensaje"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            multiline
            rows={4}
            required
          />

          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              sx={{ fontWeight: 900 }}
              onClick={send}
              disabled={!canSend}
            >
              Enviar
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
// Nota: Página de contacto con un formulario para que los usuarios envíen mensajes