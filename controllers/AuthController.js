import getPrismaInstance from "../utils/PrismaClient.js";
import { generateHashPassword } from "../utils/generatePassword.js";
import { verifyPassword } from "../utils/verifyPassword.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Create a transporter for Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
    },
});

// User registration
const createUser = async (req, res) => {
    const prisma = getPrismaInstance();
    const { name, email, password, confirmPassword } = req.body;

    try {
        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // Check if the user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Hash the password
        const hashedPassword = await generateHashPassword(password);

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Create a new user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                isVerified: false,
                isBanned: false,
                isDeleted: false,
                role: "USER",
                verificationToken: otp,
            },
        });

        // Send verification email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email - WalkAwayTrip',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
                    <div style="text-align: center;">
                        <img src="https://your-logo-url.com/logo.png" alt="WalkAwayTrip Logo" style="max-width: 150px; margin-bottom: 20px;">
                    </div>
                    <h2 style="color: #333; text-align: center;">Welcome to WalkAwayTrip!</h2>
                    <p style="color: #555; font-size: 16px; text-align: center;">
                        You're almost there! Use the OTP below to verify your email and activate your account.
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="background-color: #ba669d; color: #fff; padding: 12px 24px; font-size: 24px; font-weight: bold; border-radius: 5px; display: inline-block; letter-spacing: 4px;">
                            ${otp}
                        </span>
                    </div>
                    <p style="color: #555; font-size: 14px; text-align: center;">
                        If you didn’t create an account, you can ignore this email.
                    </p>
                    <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">
                    <p style="color: #777; font-size: 12px; text-align: center;">
                        Need help? Contact our support team at <a href="mailto:walkawaytrip@gmail.com" style="color: #ba669d; text-decoration: none;">support@modewelt.com</a>
                    </p>
                </div>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({ message: "Error sending verification email" });
            } else {
                console.log("Email sent: " + info.response);
                res.status(201).json({ message: "User created successfully. Please check your email to verify your account.", user: newUser });
            }
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Google Sign-in
const googleSignIn = async (req, res) => {
    const prisma = getPrismaInstance();
    const { name, email, googleId, avatarUrl } = req.body;

    try {
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Create a new user with a dummy password for Google Sign-In
            user = await prisma.user.create({
                data: {
                    name,
                    email,
                    googleId,
                    avatarUrl,
                    isVerified: true, // Google users are automatically verified
                    password: "google-sign-in-no-password", // Dummy password
                },
            });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, isVerified: user.isVerified },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({ message: "Login successful", token, user });
    } catch (error) {
        console.error("Google Sign-in Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Verify user email
const verifyEmail = async (req, res) => {
    const prisma = getPrismaInstance();
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." });
        }

        // Step 1: Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Step 2: If user is already verified, return message without modifying DB
        if (user.isVerified) {
            const jwtToken = jwt.sign(
                { userId: user.id, email: user.email, role: user.role, isVerified: true },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            return res.status(200).json({
                message: "You are already verified!",
                user,
                token: jwtToken,
                alreadyVerified: true,
            });
        }

        // Check if OTP matches
        if (user.verificationToken !== otp) {
            return res.status(400).json({ message: "Invalid OTP." });
        }

        // Step 3: Mark the user as verified
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, verificationToken: null },
        });

        // Step 4: Generate JWT token
        const jwtToken = jwt.sign(
            { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role, isVerified: true }, // ✅ Include isVerified
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Email verified successfully!",
            user: updatedUser,
            token: jwtToken,
        });

    } catch (error) {
        console.error("Email verification error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// User login
const loginUser = async (req, res) => {
    const prisma = getPrismaInstance();
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Ensure the user is verified
        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in." });
        }

        // Handle Google Sign-In users
        if (user.googleId && user.password === "google-sign-in-no-password") {
            // Google Sign-In users must use Google to log in
            return res.status(400).json({ message: "Please sign in with Google or reset your password using the 'Forgot Password' option." });
        }

        // Handle manual login users
        if (!user.password || user.password === "google-sign-in-no-password") {
            return res.status(400).json({ message: "Please set a password to log in manually." });
        }

        // Verify password for manual login users
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, isVerified: user.isVerified },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
    console.log("Request password reset");
    const prisma = getPrismaInstance();
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Generate a password reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry },
        });

        // Send password reset email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset - WalkAwayTrip',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
                    <h2 style="color: #333; text-align: center;">Password Reset</h2>
                    <p style="color: #555; font-size: 16px; text-align: center;">
                        Click the button below to reset your password.
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${process.env.VITE_CLIENT_URL}/auth/reset-password?token=${resetToken}"
                           style="background-color: #ba669d; color: #fff; text-decoration: none; padding: 12px 20px; font-size: 16px; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #555; font-size: 14px; text-align: center;">
                        If you didn’t request a password reset, you can ignore this email.
                    </p>
                </div>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({ message: "Error sending password reset email" });
            } else {
                console.log("Email sent: " + info.response);
                res.status(200).json({ message: "Password reset email sent." });
            }
        });
    } catch (error) {
        console.error("Error requesting password reset:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Reset user password
const resetPassword = async (req, res) => {
    const prisma = getPrismaInstance();
    const { newPassword, token } = req.body;

    try {
        // Convert the current timestamp to a valid DateTime string
        const currentDateTime = new Date().toISOString();

        // Find the user with a valid reset token and expiry
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: currentDateTime }, // Compare with a valid DateTime string
            },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        // Hash the new password
        const hashedPassword = await generateHashPassword(newPassword);

        // Update the user's password and clear the reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        res.status(200).json({ message: "Password reset successful." });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// User logout
const logoutUser = async (req, res) => {
    const prisma = getPrismaInstance();

    try {
        const token = req.header("Authorization")?.split(" ")[1];

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "No token provided for logout.",
            });
        }

        // Decode the token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Store the token in the blacklist
        await prisma.blacklistedToken.create({
            data: {
                token,
                userId: decodedToken.userId,
            },
        });

        res.status(200).json({
            success: true,
            message: "Logout successful. Token has been blacklisted.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while logging out.",
            error: error.message,
        });
    }
};

export { createUser, googleSignIn, verifyEmail, requestPasswordReset, resetPassword, loginUser, logoutUser };
