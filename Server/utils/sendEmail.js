import nodemailer from "nodemailer";

const configured = () => process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

export const sendEmail = async ({ to, subject, text, html }) => {
  // Development without mail settings: print the email in the server terminal
  if (!configured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured on the server");
    }
    console.log(`\n[DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};