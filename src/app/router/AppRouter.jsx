import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../../pages/Home.jsx";
import Login from "../../pages/Login.jsx";
import Register from "../../pages/Register.jsx";
import Profile from "../../pages/Profile.jsx";
import Staff from "../../pages/Staff.jsx";
import Checkout from "../../pages/Checkout.jsx";
import { useApp } from "../../context/AppContext.jsx";

function ProtectedRoute({ allowedRoles, children }) {
  const { state } = useApp();

  if (!state.auth.isAuth) return <Navigate to="/login" replace />;

  const role = state.auth.user?.role ?? "customer";
  const ok = allowedRoles.includes(role);

  return ok ? children : <Navigate to="/" replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <Checkout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={["staff", "manager"]}>
            <Staff />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

