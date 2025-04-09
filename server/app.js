import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Welcome route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Soul Society" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default app;
