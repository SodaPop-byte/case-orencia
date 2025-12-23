import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER, // 👈 LOGINS with the ID (9e4...)
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            // 👇 CRITICAL FIX: Must use SENDER_EMAIL, not EMAIL_USER
            from: `"Casa Orencia Security" <${process.env.SENDER_EMAIL}>`, 
            to: email,
            subject: subject,
            text: text,
        });

        console.log(`✅ Email sent from ${process.env.SENDER_EMAIL} to ${email}`);
        return true;
    } catch (error) {
        console.error("❌ Email send failed:", error.message);
        return false;
    }
};

export default sendEmail;