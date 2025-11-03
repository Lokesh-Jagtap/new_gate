import express from "express";
import {
  login,
  register,
  changePassword,
  forgotPassword,
  checkRole,
  logout,
  checkUserRole,
} from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", auth, register);
router.post("/change-password", auth, changePassword);
router.post("/forgot-password", auth, forgotPassword);
router.post("/check-role", auth, checkRole);
router.post("/check-user-role", auth, checkUserRole);
router.post("/logout", logout);

export default router;
