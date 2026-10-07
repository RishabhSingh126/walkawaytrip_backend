import getPrismaInstance from "../utils/PrismaClient.js";

// Get user by ID
const getUser = async (req, res) => {
    const prisma = getPrismaInstance();
    const userId = req.user.userId; // Get userId from the authenticated user

    try {
        // Fetch user from database
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                location: true,
                avatarUrl: true,
                backgroundImageUrl: true,
                about: true,
                profileHeadline: true,
                isVerified: true,
                role: true,
                createdAt: true,
                address: true,
                city: true,
                state: true,
                country: true,
                pincode: true,
                addressTitle: true,
            },
        });

        // Check if user exists
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const completeProfile = async (req, res) => {
    const prisma = getPrismaInstance();
    const { userId } = req.params;
    const { nationality, countryCode, phone, name, email, address, city, state, country, pincode, addressTitle, avatarUrl } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                nationality,
                countryCode,
                phone,
                name: name || existingUser.name,
                address,
                city,
                state,
                country,
                pincode,
                addressTitle,
                avatarUrl: avatarUrl || existingUser.avatarUrl,
            }
        });

        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export { getUser, completeProfile };