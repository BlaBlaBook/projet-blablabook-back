// Imports
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "../config.ts";
import { router as apiRouter } from "./routers/index.router.ts";
import { globalErrorHandler } from "./middlewares/global-error-handler.middleware.ts";

// Create Express app
export const app = express();

// Autoriser les requêtes cross-origin
app.use(cors({ origin: config.allowedOrigins }));

// Body parser (application/json)
app.use(express.json());

// Cookie parser 
app.use(cookieParser());

// Configuration
app.use("/api", apiRouter);

// Global error middleware
app.use(globalErrorHandler);
