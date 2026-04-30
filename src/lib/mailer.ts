import nodemailer from "nodemailer";

/** Gmail App Passwords are shown with spaces; env value may include or omit them. */
function normalizeSmtpPassword(raw: string): string {
  return raw.replace(/\s+/g, "");
}

export function isSmtpConfigured(): boolean {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  return Boolean(user && pass);
}

/**
 * Sends admin 2FA OTP. Credentials must come from environment only — never from request body or source code.
 * Typical Gmail App Password setup:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_SECURE=true
 *   SMTP_USER=you@gmail.com
 *   SMTP_PASS=xxxx xxxx xxxx xxxx   (spaces optional)
 */
export async function sendAdminOtpEmail(
  to: string,
  code: string,
  expireMinutes: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSmtpConfigured()) {
    return { ok: false, error: "SMTP not configured" };
  }

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT?.trim() || "465");
  const secure =
    process.env.SMTP_SECURE === undefined
      ? port === 465
      : process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1";
  const user = process.env.SMTP_USER!.trim();
  const pass = normalizeSmtpPassword(process.env.SMTP_PASS!);
  const from = process.env.SMTP_FROM?.trim() || user;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from,
      to,
      subject: "Cloud Nexus — Admin verification code",
      text: `Your admin verification code is: ${code}\n\nIt expires in ${expireMinutes} minutes.\n\nIf you did not request this, ignore this email.`,
      html: `<p>Your admin verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px;">${code}</p><p>This code expires in <strong>${expireMinutes}</strong> minutes.</p><p>If you did not request this, you can ignore this email.</p>`,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP send failed";
    return { ok: false, error: message };
  }
}
