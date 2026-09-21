import { Resend } from "resend";
import { TransactionalEmail } from "@/emails/transactional";
export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return false;
  const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    react: <TransactionalEmail subject={subject} text={text} />,
  });
  if (result.error) throw new Error("EMAIL_DELIVERY_FAILED");
  return true;
}
export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
