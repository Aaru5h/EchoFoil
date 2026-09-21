export async function verifyHuman(token?: string, honeypot?: string) {
  if (honeypot) throw new Error("INVALID_REQUEST");
  if (!process.env.TURNSTILE_SECRET_KEY) return;
  if (!token) throw new Error("HUMAN_VERIFICATION");
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
  });
  const result = await response.json();
  if (!result.success) throw new Error("HUMAN_VERIFICATION");
}
