const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.ethereal.email",
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: process.env.MAIL_USER && process.env.MAIL_PASS
      ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
      : undefined,
  });

  return transporter;
}

exports.sendEmailSimulation = async ({ to, subject, html }) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log("[EMAIL_SIMULATION]", { to, subject, html });
    return { simulated: true };
  }

  const info = await getTransporter().sendMail({
    from: process.env.MAIL_FROM || "HMS <noreply@hms.local>",
    to,
    subject,
    html,
  });

  return { simulated: false, messageId: info.messageId };
};

// Send email with optional attachments
exports.sendEmail = async ({ to, subject, html, attachments = [] }) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log("[EMAIL_SIMULATION]", { to, subject, html, attachmentCount: attachments.length });
    return { simulated: true };
  }

  const info = await getTransporter().sendMail({
    from: process.env.MAIL_FROM || "HMS <noreply@hms.local>",
    to,
    subject,
    html,
    attachments,
  });

  return { simulated: false, messageId: info.messageId };
};
