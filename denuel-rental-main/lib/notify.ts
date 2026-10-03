import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

let transporter: any = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, auth: { user: SMTP_USER, pass: SMTP_PASS } });
}

export async function notifyEmail(to: string, subject: string, html: string) {
  if (transporter) {
    return transporter.sendMail({ from: SMTP_USER, to, subject, html });
  }
  // fallback to console log for dev
  console.log('[notify] %s -> %s : %s', subject, to, html);
  return true;
}

const notify = { notifyEmail };
export default notify;