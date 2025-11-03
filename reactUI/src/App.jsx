import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import Dashboard from "./components/Dashboard";
import HomePage from "./components/HomePage";
import GateEntryReport from "./components/GateEntryReport";
import Cancel from "./components/Cancel";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* 🌐 Public Routes */}
      <Route path="/" element={<Login />} />

      {/* 🔒 Protected Routes */}
      <Route
        path="/homepage"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/gate-entry-report"
        element={
          <ProtectedRoute>
            <GateEntryReport />
          </ProtectedRoute>
        }
      />

      {/* 🧩 Cancel Tab — visible to Admin + Superadmin only */}
      <Route
        path="/cancel-tab"
        element={
          <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
            <Cancel />
          </ProtectedRoute>
        }
      />

      {/* 🔐 Forgot Password — only for Superadmin after login */}
      <Route
        path="/forgot-password"
        element={
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <ForgotPassword />
          </ProtectedRoute>
        }
      />

      {/* 🚦 Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
