import { verifyTokenHelper } from "../config/jwt.js";

/**
 * Middleware to authenticate and authorize requests via JWT.
 * Looks for token in HttpOnly cookie or Authorization header.
 */
export const auth = (req, res, next) => {
  try {
    // 1️⃣ Extract JWT token from either cookie or "Authorization: Bearer" header
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // 2️⃣ Verify and decode token
    const decoded = verifyTokenHelper(token);
    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(403).json({
        success: false,
        message: "Invalid token payload.",
      });
    }

    // 3️⃣ Attach decoded user info to request object
    req.user = Object.freeze({
      id: decoded.id,
      role: decoded.role,
    });

    // 4️⃣ Proceed to next middleware or route handler
    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};
