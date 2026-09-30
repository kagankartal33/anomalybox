import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { env } from "@/lib/env";

const TOKEN_VERSION = "v1";
const ALGORITHM = "aes-256-gcm";

function tokenKey() {
  return createHash("sha256").update(env.linkedAccountTokenSecret(), "utf8").digest();
}

export function encryptLinkedAccountToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, tokenKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    TOKEN_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptLinkedAccountToken(value: string) {
  const [version, ivValue, tagValue, encryptedValue] = value.split(":");
  if (version !== TOKEN_VERSION || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("Unsupported linked account token format");
  }

  const decipher = createDecipheriv(ALGORITHM, tokenKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}