import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { generateToken, verifyTokenHelper } from "../config/jwt.js";

//-------------Login---------------
export const login = async (req, res) => {
  const { id, password } = req.body;

  try {
    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: "ID and password are required.",
      });
    }

    const result = await pool.query(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (
      !result.rows.length ||
      !(await bcrypt.compare(password, result.rows[0].password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const user = result.rows[0];
    const token = generateToken({ id: user.id, role: user.role });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.json({
      success: true,
      message: "Login successful",
      id: user.id,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//-------------Register---------------
export const register = async (req, res) => {
  try {
    const { id, role, password } = req.body;
    const requester = req.user; // Comes from JWT

    // ✅ Only admin can register new users (not superadmin or users)
    if (requester.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can register new users.",
      });
    }

    if (!id || !role || !password) {
      return res.status(400).json({
        success: false,
        message: "ID, role, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists.",
      });
    }

    // ✅ Auto-hash password before insertion
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (id, password, role) VALUES ($1, $2, $3)`,
      [id, hashedPassword, role]
    );

    res.status(201).json({
      success: true,
      message: `User '${id}' registered successfully.`,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while registering user.",
    });
  }
};

//-------------Change-Password---------------
export const changePassword = async (req, res) => {
  const { id, oldPassword, newPassword } = req.body;

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request. Please log in again.",
      });
    }

    if (req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "You can only change your own password.",
      });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old and new passwords are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const result = await pool.query(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid old password.",
      });
    }

    // 🔒 Prevent Superadmin password change
    if (user.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Superadmin password cannot be changed.",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [
      hashed,
      id,
    ]);

    res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

//-------------Forgot-Password---------------
export const forgotPassword = async (req, res) => {
  try {
    const requester = req.user; // From JWT
    const { userId, newPassword } = req.body;

    // ✅ Only superadmin can reset other users’ or admins’ passwords
    if (requester.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Superadmin can reset passwords.",
      });
    }

    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "User ID and new password are required.",
      });
    }

    // 🚫 Prevent Superadmin from changing own password
    if (userId.toLowerCase() === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Superadmin password cannot be changed.",
      });
    }

    const userRes = await pool.query(
      `SELECT id FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (!userRes.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [
      hashed,
      userId,
    ]);

    res.json({
      success: true,
      message: `Password for '${userId}' reset successfully by Superadmin.`,
    });
  } catch (err) {
    console.error("ForgotPassword error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while resetting password.",
    });
  }
};

//-------------Logout---------------
export const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/",
    });

    req.user = null;

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error during logout.",
    });
  }
};

//-------------Check-User-Role---------------
export const checkUserRole = async (req, res) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Superadmin privileges required.",
      });
    }

    const { id } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const result = await pool.query(
      `SELECT role FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      role: result.rows[0].role,
    });
  } catch (err) {
    console.error("CheckUserRole error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while checking user role.",
    });
  }
};

//-------------Check-Role---------------
export const checkRole = (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Token missing.",
      });
    }

    const decoded = verifyTokenHelper(token);
    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(403).json({
        success: false,
        message: "Invalid or malformed token.",
      });
    }

    res.status(200).json({
      success: true,
      id: decoded.id,
      role: decoded.role,
    });
  } catch (err) {
    console.error("CheckRole error:", err.message);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};
