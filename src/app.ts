// Imports
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "../config.ts";
import { globalErrorHandler } from "./middlewares/global-error-handler.middleware.ts";

// Create Express app
export const app = express();

// Autoriser les requêtes cross-origin
app.use(cors({ origin: config.allowedOrigins }));

// Body parser (application/json)
app.use(express.json());

// Cookie parser 
app.use(cookieParser());

// Health check route
app.use("/", (req, res) => {
  res.send("BlaBlaBook API is running!");
});

// Global error middleware
app.use(globalErrorHandler);
