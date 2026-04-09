const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS, // Gmail App Password
    },
});

const APP_NAME = "CampusEats";
const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const sendVerificationEmail = async (email, token) => {
    const url = `${BASE_URL}/verify-email?token=${token}`;
    await transporter.sendMail({
        from: `"${APP_NAME}" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `Verify your ${APP_NAME} account`,
        html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px">
                <h2 style="color:#ff6b35">🍔 Welcome to ${APP_NAME}!</h2>
                <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
                <a href="${url}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Verify Email</a>
                <p style="margin-top:24px;color:#888;font-size:0.85rem">If you didn't create an account, you can ignore this email.</p>
            </div>
        `,
    });
};

const sendPasswordResetEmail = async (email, token) => {
    const url = `${BASE_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
        from: `"${APP_NAME}" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `Reset your ${APP_NAME} password`,
        html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px">
                <h2 style="color:#ff6b35">🔑 Password Reset</h2>
                <p>You requested a password reset for your ${APP_NAME} account. Click the button below — this link expires in 15 minutes.</p>
                <a href="${url}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Reset Password</a>
                <p style="margin-top:24px;color:#888;font-size:0.85rem">If you didn't request this, you can ignore this email. Your password will not change.</p>
            </div>
        `,
    });
};

const sendOrderStatusEmail = async (email, name, order) => {
    const statusMessages = {
        accepted: "Your order has been accepted! 👨‍🍳",
        preparing: "Your food is being prepared! 🍳",
        ready: "Your order is ready for pickup! 🎉",
        completed: "Your order is complete. Enjoy your meal! 😋",
        cancelled: "Your order has been cancelled.",
    };
    const msg = statusMessages[order.status] || `Order status updated to: ${order.status}`;

    await transporter.sendMail({
        from: `"${APP_NAME}" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `${APP_NAME} Order Update — Token #${order.tokenNumber}`,
        html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px">
                <h2 style="color:#ff6b35">📦 Order Update</h2>
                <p>Hi ${name},</p>
                <p style="font-size:1.1rem">${msg}</p>
                <p><strong>Token Number:</strong> #${order.tokenNumber}</p>
                <p><strong>Amount:</strong> ₹${order.totalAmount}</p>
            </div>
        `,
    });
};

const sendLowStockAlert = async (adminEmails, items) => {
    if (!process.env.EMAIL_FROM || !items?.length) return;
    const rows = items.map(
        (i) => `<tr><td style="padding:6px 12px">${i.name}</td><td style="padding:6px 12px;text-align:center">${i.stockQty} ${i.unit}</td><td style="padding:6px 12px;color:${i.stockQty === 0 ? '#ef4444' : '#f59e0b'};font-weight:bold">${i.stockQty === 0 ? 'OUT OF STOCK' : 'LOW'}</td></tr>`
    ).join("");
    await transporter.sendMail({
        from: `"${APP_NAME}" <${process.env.EMAIL_FROM}>`,
        to: adminEmails.join(","),
        subject: `⚠️ ${APP_NAME} — Low Stock Alert`,
        html: `
            <div style="font-family:sans-serif;max-width:640px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px">
                <h2 style="color:#ef4444">⚠️ Low Stock Warning</h2>
                <p>The following ingredients need restocking:</p>
                <table style="width:100%;border-collapse:collapse;margin-top:12px">
                    <thead><tr style="background:#ff6b35;color:#fff">
                        <th style="padding:8px 12px;text-align:left">Ingredient</th>
                        <th style="padding:8px 12px">Remaining</th>
                        <th style="padding:8px 12px">Status</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <p style="margin-top:20px;color:#888;font-size:0.85rem">Update stock at your CampusEats admin panel → Inventory.</p>
            </div>
        `,
    });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendOrderStatusEmail, sendLowStockAlert };
