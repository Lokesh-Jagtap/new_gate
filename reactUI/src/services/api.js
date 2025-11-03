// frontend/src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "/api", // ✅ All requests go to /api/*
  withCredentials: true,
    headers: {
    "Content-Type": "application/json",
  },                // ✅ Required for cookies (JWT)
});

export default API;
