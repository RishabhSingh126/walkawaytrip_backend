import express from "express"; // Import express
import { completeProfile, getUser } from "../controllers/UserController.js";
import auth from "../middlewares/AuthMiddleware.js"; // Import auth middleware

const router = express.Router(); // Router object to define routes

router.put("/complete-profile/:userId", auth, completeProfile); // Route for updating user details
router.get("/get-user", auth, getUser); // Route for fetching user details

export default router; // Export the router