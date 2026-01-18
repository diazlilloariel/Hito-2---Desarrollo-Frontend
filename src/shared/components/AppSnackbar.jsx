import { Snackbar, Alert } from "@mui/material";
import { useApp } from "../../context/AppContext.jsx";

export default function AppSnackbar() {
  const { state, actions } = useApp();
  const sb = state.ui?.snackbar;

  return (
    <Snackbar
      open={Boolean(sb?.open)}
      autoHideDuration={2500}
      onClose={actions.closeSnackbar}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        onClose={actions.closeSnackbar}
        severity={sb?.severity ?? "info"}
        variant="filled"
        sx={{ fontWeight: 800 }}
      >
        {sb?.message ?? ""}
      </Alert>
    </Snackbar>
  );
}
// Nota: Componente de snackbar para mostrar notificaciones breves en la parte inferior de la pantalla