import express from "express"; // Import express
import cors from "cors"; // Import cors
import dotenv from "dotenv"; // Import dotenv
import AuthRoutes from "./routes/AuthRoutes.js"; // Import AuthRoutes
import UserRoutes from "./routes/UserRoutes.js"; // Import UserRoutes
import ContactRoutes from "./routes/ContactRoutes.js";
import TrainRoutes from "./routes/TrainRoutes.js";
import LocationRoutes from "./routes/LocationRoutes.js";

dotenv.config(); // Load environment variables from a .env file into process.env

const app = express(); // Create an Express app

app.use(cors()); // Enable CORS for all requests
app.use(express.json()); // Parse incoming requests with JSON payloads

// Route handling
app.use("/api/auth", AuthRoutes); // Route for user-related requests
app.use("/api/user", UserRoutes); // Route for user-related requests
app.use("/api/contact", ContactRoutes);
app.use("/api/trains", TrainRoutes);
app.use("/api/locations", LocationRoutes);

// Database connectiontact-related requests

const server = app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})
