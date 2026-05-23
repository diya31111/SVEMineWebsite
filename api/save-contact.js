const CONTACT_RECIPIENT_EMAIL = "sveinterior@yahoo.com";

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    let body;
    try {
        body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
        return res.status(400).json({ error: "Invalid request body" });
    }

    if (!body) {
        return res.status(400).json({ error: "Missing request body" });
    }

    const { firstName, lastName = "", email, message } = body;

    if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Invalid email address" });
    }

    if (!firstName || !message) {
        return res.status(400).json({ error: "First name and message are required" });
    }

    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("Contact form email is not configured. Set EMAIL_USER and EMAIL_PASS.");
            return res.status(500).json({ error: "Email service is not configured" });
        }

        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        const fullName = `${firstName} ${lastName}`.trim();
        const safeName = escapeHtml(fullName);
        const safeEmail = escapeHtml(email);
        const safeMessage = escapeHtml(message);

        await transporter.sendMail({
            from: `"SVE Interior" <${process.env.EMAIL_USER}>`,
            to: CONTACT_RECIPIENT_EMAIL,
            replyTo: email,
            subject: `New SVE Enquiry: ${fullName}`,
            text: `You have received a new inquiry for SVE Interior:

Name: ${fullName}
Email: ${email}
Message: ${message}

Date: ${submittedAt}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h2 style="color: #bc8f8f;">New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${safeName}</p>
                    <p><strong>Email:</strong> ${safeEmail}</p>
                    <p><strong>Message:</strong></p>
                    <p style="background: #f9f5f3; padding: 12px; border-radius: 8px;">${safeMessage}</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 0.85em; color: #777;">
                        Received on ${submittedAt}
                    </p>
                </div>
            `,
        });

        return res.status(200).json({ message: "Success" });
    } catch (error) {
        console.error("Contact form error:", error);
        return res.status(500).json({ error: "Failed to process your request" });
    }
}
