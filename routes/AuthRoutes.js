import express from "express"; // Import express
import { createUser, verifyEmail, loginUser, logoutUser, googleSignIn, requestPasswordReset, resetPassword } from "../controllers/AuthController.js";
import auth from "../middlewares/AuthMiddleware.js"; // Import auth middleware

const router = express.Router(); // Router object to define routes

router.post("/signup", createUser); // Route for user signup
router.post("/google-signin", googleSignIn); // Route for user signup
router.post("/login", loginUser); // Route for user login
router.post('/verify-email', verifyEmail); // Route for verifying email
router.post("/request-password-reset", requestPasswordReset); // Route for requesting password reset
router.post("/reset-password", resetPassword); // Route for resetting password
router.post("/logout", auth, logoutUser); // Route for user logout
// router.post("/forgot-password", forgotPassword); // Route for forgot password
// router.post("/reset-password", resetPassword); // Route for reset password

export default router; // Export the router