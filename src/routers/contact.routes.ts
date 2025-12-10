import { Router } from "express";
import { sendMessage } from "../controllers/contact.controller.ts";

export const router = Router();

router.post("/contact", sendMessage);
