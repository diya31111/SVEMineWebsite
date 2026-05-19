export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { firstName, lastName, email, message } = req.body;

    if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Invalid email address" });
    }

    if (!firstName || !message) {
        return res.status(400).json({ error: "First name and message are required" });
    }

    try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"SVE Interior" <${process.env.EMAIL_USER}>`,
            to: "guptavipul1011@gmail.com",
            subject: `New Enquiry: ${firstName} ${lastName}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h2 style="color: #bc8f8f;">New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Message:</strong></p>
                    <p style="background: #f9f5f3; padding: 12px; border-radius: 8px;">${message}</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 0.85em; color: #777;">
                        Received on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
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
