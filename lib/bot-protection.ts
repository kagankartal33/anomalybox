type RecaptchaResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  challenge_ts?: string;
};

export async function verifyRecaptcha(token: string | undefined, expectedAction: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!response.ok) return false;
  const result = (await response.json()) as RecaptchaResponse;
  const hostnameAllowed = process.env.NODE_ENV !== "production" || result.hostname === "anomalybox.com" || result.hostname === "www.anomalybox.com";
  const issuedAt = result.challenge_ts ? Date.parse(result.challenge_ts) : 0;
  const fresh = issuedAt > 0 && Date.now() - issuedAt < 2 * 60 * 1000;
  return result.success === true && result.action === expectedAction && hostnameAllowed && fresh && (result.score ?? 0) >= 0.5;
}