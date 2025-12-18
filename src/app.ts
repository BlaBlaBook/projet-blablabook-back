// Imports
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "../config.ts";
import { router as apiRouter } from "./routers/index.router.ts";
import { globalErrorHandler } from "./middlewares/global-error-handler.middleware.ts";
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger.config.ts';

// Create Express app
export const app = express();

// Autoriser les requêtes cross-origin
app.use(cors({ 
  origin: config.allowedOrigins,
  credentials: true,
}));

// Body parser (application/json)
app.use(express.json());

// Cookie parser 
app.use(cookieParser());

// Configuration
app.use("/api", apiRouter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customSiteTitle: 'Blablabook API Documentation',
}));

// Global error middleware
app.use(globalErrorHandler);