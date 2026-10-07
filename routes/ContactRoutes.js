import express from "express";
import { handleContactForm } from "../controllers/ContactController.js";

const router = express.Router();

// Define route
router.post("/contact", handleContactForm);

export default router;
