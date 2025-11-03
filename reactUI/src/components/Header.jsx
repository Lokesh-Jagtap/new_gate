import React, { useEffect, useState, useRef } from "react";
import { Calendar, Clock, User, Lock, Plus, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { validatePassword, passwordErrorMessage } from "./ValidatePassword";
import "../App.css";
import axios from "axios";
import API from "../services/api";

const Header = ({ title }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // User info and role
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("user");

  // Change Password State
  const [pwdData, setPwdData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Register State
  const [registerData, setRegisterData] = useState({
    id: "",
    password: "",
    role: "user",
  });
  const [registerErrors, setRegisterErrors] = useState({});
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const navigate = useNavigate();
  const menuRef = useRef(null);

  // ---------------- Fetch user info ----------------
  const fetchUserInfo = async () => {
    try {
      const res = await API.post("/check-role");
      if (res.data?.success) {
        setRole(res.data.role);
        setUserId(res.data.id);
      } else {
        console.warn("Role check failed:", res.data?.message);
      }
    } catch (err) {
      console.error("❌ Failed to fetch user info:", err);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format date & time
  const formatDateTime = (date) => {
    const dateOptions = { year: "numeric", month: "long", day: "numeric" };
    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return {
      date: date.toLocaleDateString("en-US", dateOptions),
      time: date.toLocaleTimeString("en-US", timeOptions),
    };
  };

  const { date, time } = formatDateTime(currentDateTime);

  // ---------------- Logout ----------------
  const handleLogout = async () => {
    try {
      const res = await API.post("/logout", {});
      if (res.data.success) {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ---------------- Change Password Handlers ----------------
  const togglePasswordVisibility = (field) =>
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  const handlePwdChange = (e) => {
    const { name, value } = e.target;
    setPwdData((prev) => ({ ...prev, [name]: value }));
    if (pwdErrors[name]) setPwdErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleChangePassword = async () => {
    setPwdErrors({});
    const errors = {};

    if (!pwdData.oldPassword) errors.oldPassword = "Old password is required";
    if (!pwdData.newPassword) errors.newPassword = "New password is required";
    if (!pwdData.confirmPassword)
      errors.confirmPassword = "Please confirm password";

    if (
      pwdData.newPassword &&
      pwdData.confirmPassword &&
      pwdData.newPassword !== pwdData.confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (pwdData.newPassword && !validatePassword(pwdData.newPassword)) {
      errors.newPassword = passwordErrorMessage;
    }

    if (Object.keys(errors).length > 0) {
      setPwdErrors(errors);
      return;
    }

    setPwdLoading(true);
    try {
      const response = await API.post("/change-password", {
        id: userId,
        oldPassword: pwdData.oldPassword,
        newPassword: pwdData.newPassword,
      });

      if (response.data.success) {
        alert("Password changed successfully!");
        setPwdData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setShowChangePwd(false);
      } else {
        setPwdErrors({ oldPassword: response.data.message });
      }
    } catch (error) {
      setPwdErrors({
        oldPassword: error.response?.data?.message || "Network error occurred",
      });
    } finally {
      setPwdLoading(false);
    }
  };

  // ---------------- Register User Handlers ----------------
  const toggleRegisterPasswordVisibility = () =>
    setShowRegisterPassword((prev) => !prev);

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
    if (registerErrors[name])
      setRegisterErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRegisterUser = async () => {
    setRegisterErrors({});
    const errors = {};

    if (!registerData.id) errors.id = "ID is required";
    if (!registerData.password) errors.password = "Password is required";

    if (registerData.password && !validatePassword(registerData.password)) {
      errors.password = passwordErrorMessage;
    }

    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }

    setRegisterLoading(true);
    try {
      const response = await API.post("/register", {
        id: registerData.id,
        role: registerData.role,
        password: registerData.password,
      });

      if (response.data.success) {
        alert("User registered successfully!");
        setRegisterData({ id: "", role: "user", password: "" });
        setShowRegister(false);
      } else {
        alert(response.data.message);
        setRegisterErrors({ id: response.data.message });
      }
    } catch (error) {
      setRegisterErrors({
        id: error.response?.data?.message || "Network error occurred",
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  // ---------------- JSX ----------------
  return (
    <header className="bg-white shadow-sm border-bottom fixed-top">
      <div className="container-fluid d-flex justify-content-between align-items-center py-3">
        <h1 className="h5 fw-bold mb-0">{title}</h1>

        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center text-muted small">
            <Calendar size={16} className="me-1" />
            {date}
          </div>
          <div className="d-flex align-items-center text-muted small">
            <Clock size={16} className="me-1" />
            {time}
          </div>

          {/* --- User Menu --- */}
          <div
            className="position-relative d-flex align-items-center gap-2"
            ref={menuRef}
          >
            <span className="fw-bold fs-6 text-dark">{userId || "User"}</span>

            <div
              className="bg-primary d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: "32px", height: "32px", cursor: "pointer" }}
              onClick={() => setShowMenu((prev) => !prev)}
            >
              <User size={16} className="text-white" />
            </div>

            {/* --- Dropdown Menu --- */}
            {showMenu && (
              <div
                className="dropdown-menu show shadow-sm"
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  minWidth: "180px",
                  marginTop: "0.7rem",
                }}
              >
                {/* Change Password */}
                <button
                  className="dropdown-item d-flex align-items-center"
                  onClick={() => {
                    setShowChangePwd(true);
                    setShowMenu(false);
                  }}
                >
                  <Lock size={14} className="me-2" />
                  Change Password
                </button>

                {/* Admin + Superadmin can register */}
                {(role === "admin" || role === "superadmin") && (
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => {
                      setShowRegister(true);
                      setShowMenu(false);
                    }}
                  >
                    <Plus size={14} className="me-2" />
                    Register User
                  </button>
                )}

                {/* ✅ Superadmin only — Forgot Password */}
                {role === "superadmin" && (
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => {
                      navigate("/forgot-password");
                      setShowMenu(false);
                    }}
                  >
                    <Lock size={14} className="me-2" />
                    Forgot Password
                  </button>
                )}

                <div className="dropdown-divider"></div>

                <button
                  className="dropdown-item d-flex align-items-center text-danger"
                  onClick={handleLogout}
                >
                  <Lock size={14} className="me-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Change Password Modal --- */}
      {showChangePwd && (
        <>
          <div className="modal-backdrop fade show backdrop-blur"></div>
          <div className="modal show fade d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Change Password</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowChangePwd(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {["oldPassword", "newPassword", "confirmPassword"].map(
                    (field) => (
                      <div className="position-relative mb-2" key={field}>
                        <input
                          type={showPasswords[field] ? "text" : "password"}
                          name={field}
                          value={pwdData[field]}
                          onChange={handlePwdChange}
                          className={`form-control pe-5 ${
                            pwdErrors[field] ? "is-invalid" : ""
                          }`}
                          placeholder={
                            field === "oldPassword"
                              ? "Enter old password"
                              : field === "newPassword"
                              ? "Enter new password"
                              : "Confirm new password"
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-3"
                          style={{
                            border: "none",
                            background: "none",
                            zIndex: 10,
                          }}
                          onClick={() => togglePasswordVisibility(field)}
                        >
                          {showPasswords[field] ? (
                            <EyeOff size={16} className="text-muted" />
                          ) : (
                            <Eye size={16} className="text-muted" />
                          )}
                        </button>
                        {pwdErrors[field] && (
                          <div className="invalid-feedback d-block">
                            {pwdErrors[field]}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowChangePwd(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleChangePassword}
                    disabled={pwdLoading}
                  >
                    {pwdLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- Register User Modal --- */}
      {showRegister && (role === "admin" || role === "superadmin") && (
        <>
          <div className="modal-backdrop fade show backdrop-blur"></div>
          <div className="modal show fade d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Register New User</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowRegister(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <input
                    type="text"
                    name="id"
                    value={registerData.id}
                    onChange={handleRegisterChange}
                    className={`form-control mb-2 ${
                      registerErrors.id ? "is-invalid" : ""
                    }`}
                    placeholder="Enter ID"
                  />
                  {registerErrors.id && (
                    <div className="invalid-feedback d-block mb-2">
                      {registerErrors.id}
                    </div>
                  )}

                  <select
                    name="role"
                    value={registerData.role}
                    onChange={handleRegisterChange}
                    className="form-select mb-2"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>

                  <div className="position-relative">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      name="password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      className={`form-control pe-5 ${
                        registerErrors.password ? "is-invalid" : ""
                      }`}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-3"
                      style={{ border: "none", background: "none", zIndex: 10 }}
                      onClick={toggleRegisterPasswordVisibility}
                    >
                      {showRegisterPassword ? (
                        <EyeOff size={16} className="text-muted" />
                      ) : (
                        <Eye size={16} className="text-muted" />
                      )}
                    </button>
                    {registerErrors.password && (
                      <div className="invalid-feedback d-block">
                        {registerErrors.password}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowRegister(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleRegisterUser}
                    disabled={registerLoading}
                  >
                    {registerLoading ? "Registering..." : "Register"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
