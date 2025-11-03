import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET; // use .env in prod

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
};

export const verifyTokenHelper = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
