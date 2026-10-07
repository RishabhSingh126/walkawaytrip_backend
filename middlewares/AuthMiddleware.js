import jwt from "jsonwebtoken"; // Import JWT library
import getPrismaInstance from "../utils/PrismaClient.js"; // Import Prisma

// Middleware function to authenticate and check verification
const authMiddleware = async (req, res, next) => {
    const prisma = getPrismaInstance(); // Get Prisma client instance
    const token = req.header("Authorization")?.split(" ")[1]; // Extract token

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        // Check if the token is blacklisted
        const blacklistedToken = await prisma.blacklistedToken.findUnique({ where: { token } });
        if (blacklistedToken) {
            return res.status(401).json({ message: "Token is blacklisted." });
        }

        // Verify the token and extract user data
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user data to request

        // Ensure the user is verified before proceeding
        if (!decoded.isVerified) {
            return res.status(403).json({ message: "Please verify your email before accessing this resource." });
        }

        next(); // Continue to the next middleware
    } catch (error) {
        res.status(401).json({ message: "Token is invalid or expired" });
    }
};

export default authMiddleware;
