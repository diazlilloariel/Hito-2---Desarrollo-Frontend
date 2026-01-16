import { Container, Paper, TextField, Button, Typography, Stack } from "@mui/material";

export default function Register() {
  return (
    <Container sx={{ py: 4, maxWidth: 520 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={900} mb={2}>
          Registrarse
        </Typography>

        <Stack spacing={2}>
          <TextField label="Email" required />
          <TextField label="Password" type="password" required />
          <TextField label="Avatar URL" />
          <Button variant="contained">Crear cuenta</Button>
        </Stack>
      </Paper>
    </Container>
  );
}
