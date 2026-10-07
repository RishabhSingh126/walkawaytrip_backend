import getPrismaInstance from "../utils/PrismaClient.js";
import nodemailer from "nodemailer";

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Handle contact form submission
export const handleContactForm = async (req, res) => {
    const prisma = getPrismaInstance();

    try {
        const { fullName, email, message } = req.body;

        if (!fullName || !email) {
            return res.status(400).json({ message: "Full name and email are required." });
        }

        // Save contact request in database
        const newContact = await prisma.contact.create({
            data: {
                fullName,
                email,
                message,
            },
        });

        // Send Email Notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Sending to yourself so you receive the notification
            subject: `New Contact Request from ${fullName}`,
            html: `
                <h3>New Contact Request</h3>
                <p><strong>Name:</strong> ${fullName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong> ${message || "No message provided"}</p>
                <p><br/><i>This request was submitted from the WalkAwayTrip Don't Miss Out form.</i></p>
            `,
        };

        // Send email asynchronously (no need to await and block the user response, but for safety we await)
        await transporter.sendMail(mailOptions);

        return res.status(201).json({ message: "Contact request submitted successfully." });
    } catch (error) {
        console.error("Error in contact form submission:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
