import React, { useState } from "react";
import { validatePassword, passwordErrorMessage } from "./ValidatePassword";
import {
  User,
  Lock,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import BackButton from "./BackButton";

const ForgotPassword = () => {
  const [userId, setUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("warning");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  //------------------ Validate Form ------------------
  const validateForm = () => {
    const newErrors = {};

    if (!userId.trim()) newErrors.userId = "User ID is required";

    if (userId.trim().toLowerCase() === "superadmin")
      newErrors.userId = "Superadmin password cannot be changed";

    if (!newPassword.trim()) newErrors.newPassword = "Password is required";
    else if (!validatePassword(newPassword))
      newErrors.newPassword = passwordErrorMessage;

    if (!confirmPassword.trim())
      newErrors.confirmPassword = "Confirm Password is required";
    else if (newPassword !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //------------------ Handle Password Reset ------------------
  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setMessage("");
    try {
      const res = await API.post("/forgot-password", {
        adminId: "superadmin", // fixed ID for the superadmin
        userId,
        newPassword,
      });

      if (res.data.success) {
        setMessage("✅ Password reset successfully!");
        setMessageType("success");
        setUserId("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
      } else {
        setMessage(res.data.message || "Failed to reset password");
        setMessageType("error");
      }
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Server error. Please try again later."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <BackButton />
      <div
        className="row shadow-lg rounded-3 overflow-hidden w-100"
        style={{ maxWidth: "900px" }}
      >
        {/* Left panel */}
        <div className="col-md-6 d-none d-md-flex flex-column align-items-center justify-content-center bg-primary text-white p-5">
          <h1 className="fw-bold text-center">Reset User Password</h1>
          <p className="text-center mt-3">
            Superadmin can reset passwords for admins and users only.
          </p>
        </div>

        {/* Right panel */}
        <div className="col-12 col-md-6 bg-white p-5 d-flex flex-column justify-content-center">
          {message && (
            <div
              className={`alert small d-flex align-items-center ${
                messageType === "success"
                  ? "alert-success"
                  : messageType === "error"
                  ? "alert-danger"
                  : "alert-warning"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle size={16} className="me-2" />
              ) : (
                <AlertCircle size={16} className="me-2" />
              )}
              {message}
            </div>
          )}

          {/* User ID */}
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <User size={18} className="text-muted" />
              </span>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={`form-control ${errors.userId ? "is-invalid" : ""}`}
                placeholder="Enter User/Admin ID"
                disabled={loading}
              />
              {errors.userId && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle size={14} className="me-1" />
                  {errors.userId}
                </div>
              )}
            </div>
          </div>

          {/* New Password */}
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Lock size={18} className="text-muted" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`form-control ${
                  errors.newPassword ? "is-invalid" : ""
                }`}
                placeholder="New Password"
                disabled={loading}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.newPassword && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle size={14} className="me-1" />
                  {errors.newPassword}
                </div>
              )}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Lock size={18} className="text-muted" />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`form-control ${
                  errors.confirmPassword ? "is-invalid" : ""
                }`}
                placeholder="Confirm Password"
                disabled={loading}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.confirmPassword && (
                <div className="invalid-feedback d-flex align-items-center">
                  <AlertCircle size={14} className="me-1" />
                  {errors.confirmPassword}
                </div>
              )}
            </div>
          </div>

          <button
            className="btn btn-success"
            onClick={handleChangePassword}
            disabled={loading}
          >
            {loading ? "Processing..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
