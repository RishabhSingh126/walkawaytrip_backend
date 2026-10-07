import { PrismaClient } from "@prisma/client"; // Import PrismaClient from @prisma/client

// Create a variable to store the PrismaClient instance
let prismaInstance = null;

// Create a function to get the PrismaClient instance
function getPrismaInstance() {
    if (!prismaInstance) { // If the PrismaClient instance is not created
        prismaInstance = new PrismaClient(); // Create a new PrismaClient instance
    }
    return prismaInstance; // Return the PrismaClient instance
}

// Export the getPrismaInstance function
export default getPrismaInstance; 