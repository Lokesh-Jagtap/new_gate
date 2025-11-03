import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Truck, User, Lock, AlertCircle } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../services/api";

const Login = () => {
  const [formData, setFormData] = useState({
    id: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  // 🧩 Clear JWT cookie when visiting login page
  useEffect(() => {
    // Always call backend logout to clear HttpOnly cookie
    const clearToken = async () => {
      try {
        await axios.post("/api/logout", {}, { withCredentials: true });
        console.log("✅ Token cleared by backend");
      } catch (err) {
        console.warn("⚠️ Failed to clear token:", err.message);
      }
    };

    clearToken();
  }, []);

  // ✅ Block browser back button on login page
  useEffect(() => {
    // Push a dummy state to history
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      // Push state again to prevent going back
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.id.trim()) newErrors.id = "Username is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setMessage("");

    try {
      // 🔹 Send login request (cookies automatically included)
      const { data } = await API.post("/login", {
        id: formData.id,
        password: formData.password,
      });

      // 🔹 Handle success
      if (data.success) {
        setMessage("Login successful!");
        navigate("/homepage"); // Redirect to homepage after login
      } else {
        // Fallback in case backend doesn’t send success flag
        setErrors({ form: "Unexpected response from server." });
      }
    } catch (err) {
      // 🔹 Graceful error handling
      const msg =
        err.response?.data?.message || "Server error. Please try again later.";

      if (msg === "Invalid username or password") {
        setErrors({ form: msg });
      } else {
        setErrors({ form: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-white">
      <div
        className="row shadow-lg rounded-3 overflow-hidden w-100"
        style={{ maxWidth: "900px" }}
      >
        {/* Left Section */}
        <div className="col-md-6 d-none d-md-flex flex-column align-items-center justify-content-center bg-primary text-white p-5">
          <Truck size={70} className="mb-4" />
          <h1 className="fw-bold text-center">Industrial Gate Entry System</h1>
          <p className="text-center mt-3">
            Secure, reliable and fast access control for your facility.
          </p>
        </div>

        {/* Right Section */}
        <div className="col-12 col-md-6 bg-white p-5 d-flex flex-column justify-content-center">
          <h2 className="fw-bold text-dark mb-4 text-center text-md-start">
            Welcome
          </h2>

          {message && (
            <div className="alert alert-warning small d-flex align-items-center">
              <AlertCircle size={16} className="me-2" />
              {message}
            </div>
          )}

          {/* Username */}
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <User size={18} className="text-muted" />
              </span>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                className={`form-control ${errors.id ? "is-invalid" : ""}`}
                placeholder="Enter your username"
              />
              {errors.id && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle size={14} className="me-1" />
                  {errors.id}
                </div>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Lock size={18} className="text-muted" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`form-control ${
                  errors.password ? "is-invalid" : ""
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.password && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle size={14} className="me-1" />
                  {errors.password}
                </div>
              )}
            </div>
          </div>

          {/* Forgot password
          <div className="d-flex justify-content-center mb-3">
            <button
              className="btn btn-link p-0 text-primary"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </button>
          </div> */}

          {/* Sign in button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="btn btn-primary w-100 mb-3"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          {/* General error feedback */}
          {errors.form && (
            <div className="alert alert-danger small d-flex align-items-center mt-2">
              <AlertCircle size={16} className="me-2" />
              {errors.form}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
