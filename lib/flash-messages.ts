/**
 * User-facing flash messages passed through `?error=` / `?report_error=` query strings.
 *
 * Pages only render messages from this registry: anything else in the URL is replaced with a generic
 * message. Rendering the raw query value would let anyone craft an anomalybox.com link that shows
 * arbitrary text on a trusted page (e.g. a fake "account suspended, call this number" notice) and
 * would leak raw database or auth-provider error strings.
 */
export const FLASH = {
  // Sign-in and account creation
  invalidCredentials: "Email or password is incorrect.",
  captchaFailed: "Security verification failed. Please try again.",
  accountMayExist: "An account may already exist for this email. Try signing in or reset your password.",
  accountCreateFailed: "Your account could not be created. Please check the details and try again.",
  accountCreateRetry: "Your account could not be created. Please try again.",
  passwordTooShort: "Password must be at least 8 characters.",
  passwordsDoNotMatch: "Passwords do not match.",
  passwordUpdateFailed: "Your password could not be updated. Request a new recovery link.",
  passwordChangeFailed: "Your password could not be changed. Please try again.",
  googleDisabled: "Google sign-in is not enabled yet. Please use email sign-in.",
  googleStartFailed: "Google sign-in could not be started. Please try again.",
  appleDisabled: "Apple sign-in is not available yet. Please use email sign-in.",
  appleStartFailed: "Apple sign-in could not be started. Please try again.",
  oauthCancelled: "Sign-in was cancelled or could not be completed. Please try again.",
  oauthIncomplete: "The sign-in response was incomplete. Please try again.",
  sessionUnverified: "Your secure session could not be verified. Please try again.",

  // Instagram connection
  instagramNotConfigured: "Instagram connection is not configured yet.",
  instagramFailed: "Instagram could not be connected. Please try again.",

  // Onboarding
  laneRequired: "Choose at least one creator lane before continuing.",
  lanesUnavailable: "Those creator lanes are no longer available. Choose a current lane.",

  // Profile
  profileUpdateFailed: "Your account details could not be updated. Please try again.",
  avatarMissing: "Choose a PNG, JPG, or WebP avatar before uploading.",
  avatarTooLarge: "Avatar must be 2 MB or smaller.",
  avatarWrongType: "Avatar must be a PNG, JPG, or WebP image.",
  avatarUploadFailed: "Your avatar could not be uploaded. Please try again.",

  // Atelier request form
  atelierIncomplete: "Please complete the request form.",
  atelierName: "Please enter your name.",
  atelierEmail: "Please enter a valid email address.",
  atelierInstagram: "Instagram handle must be 80 characters or fewer.",
  atelierEffect: "Describe the effect you want in a few words.",
  atelierContext: "Tell us a little more about the project (at least 20 characters).",
  atelierSaveFailed: "Your request could not be saved. Please try again.",
  atelierEmailUnavailable:
    "Your request was saved, but email delivery is temporarily unavailable. Please contact support@anomalybox.com.",
  atelierEmailFailed:
    "Your request was saved, but the notification email could not be delivered. Please contact support@anomalybox.com.",

  // Card reports
  cardReportNoteRequired: "Please add a short note so the team knows what to review.",
  cardNotInVault: "This card is not available in your vault.",
  cardReportAlreadyOpen: "This card already has a report under review.",
  cardReportFailed: "Your report could not be submitted. Please try again.",
} as const;

export type FlashMessage = (typeof FLASH)[keyof typeof FLASH];

export const GENERIC_FLASH_ERROR = "Something went wrong. Please try again.";

const KNOWN_MESSAGES: ReadonlySet<string> = new Set(Object.values(FLASH));

/** Returns a message that is safe to render, or null when the query value is empty. */
export function publicFlashMessage(raw: string | string[] | null | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  return KNOWN_MESSAGES.has(value) ? value : GENERIC_FLASH_ERROR;
}
