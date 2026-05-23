const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const nodemailer = require("nodemailer");
const { listLeads, saveLead } = require("./storage");

const app = express();
const PORT = process.env.PORT || 3001;
const CONTACT_RECIPIENT_EMAIL = "sveinterior@yahoo.com";

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true
}));
app.use(bodyParser.json());

// Initialize Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendBusinessNotification({ firstName, lastName = "", email, message }) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email service is not configured. Set EMAIL_USER and EMAIL_PASS.");
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    await transporter.sendMail({
        from: `"SVE Interior" <${process.env.EMAIL_USER}>`,
        to: CONTACT_RECIPIENT_EMAIL,
        replyTo: email,
        subject: `New SVE Lead: ${fullName}`,
        text: `You have received a new inquiry for SVE Interior:

Name: ${fullName}
Email: ${email}
Message: ${message}

Date: ${submittedAt}`
    });
}

// Routes
app.post("/api/save-contact", async (req, res) => {
    const { firstName, lastName = "", email, message } = req.body;

    if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Invalid email address" });
    }

    if (!firstName || !message) {
        return res.status(400).json({ error: "First name and message are required" });
    }

    try {
        const lead = await saveLead({
            first_name: firstName,
            last_name: lastName,
            email,
            message,
        });

        await sendBusinessNotification({ firstName, lastName, email, message });

        res.status(201).json({ message: "Success", id: lead.id });
    } catch (err) {
        console.error("Contact submission error:", err.message);
        res.status(500).json({ error: err.message || "Failed to save lead" });
    }
});

app.get("/api/leads", async (_req, res) => {
    try {
        const leads = await listLeads();
        res.json(leads);
    } catch (error) {
        console.error("Lead fetch error:", error.message);
        res.status(500).json({ error: error.message || "Failed to load leads" });
    }
});

app.listen(PORT, () => {
    console.log(`SVE backend running on http://localhost:${PORT}`);
});
