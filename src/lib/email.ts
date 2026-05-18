import "server-only";
import { Resend } from "resend";

type EmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: EmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[email skipped]", { to, subject });
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  return resend.emails.send({
    from: "VISION LABS <labs@visiondance.ca>",
    to,
    subject,
    html
  });
}
