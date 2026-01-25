import { Routes, Route, Navigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";

import Home from "../../pages/Home.jsx";
import Catalog from "../../pages/Catalog.jsx";
import ProductDetail from "../../pages/ProductDetail.jsx";
import Orders from "../../pages/Orders.jsx";
import Login from "../../pages/Login.jsx";
import Register from "../../pages/Register.jsx";
import Profile from "../../pages/Profile.jsx";
import Staff from "../../pages/Staff.jsx";
import Checkout from "../../pages/Checkout.jsx";
import Policies from "../../pages/Policies.jsx";
import Contact from "../../pages/Contact.jsx";
import About from "../../pages/About.jsx";
import NotFound from "../../pages/NotFound.jsx";

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

      {/* ✅ Canonical */}
      <Route path="/catalog" element={<Catalog />} />
      {/* ✅ Alias */}
      <Route path="/catalogo" element={<Navigate to="/catalog" replace />} />

      {/* Producto */}
      <Route path="/producto/:id" element={<ProductDetail />} />
      <Route path="/productos/:id" element={<ProductDetail />} />

      <Route path="/policies" element={<Policies />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about" element={<About />} />

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
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <Orders />
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

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
// Manejo de rutas protegidas según roles de usuario
// Redirección automática para rutas alias
// Uso de componente ProtectedRoute para validación de acceso