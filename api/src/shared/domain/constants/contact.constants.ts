export const EMAIL_MAX_LENGTH = 254;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** After removing spaces, dashes and parentheses: optional "+" and 7-15 digits. */
export const PHONE_PATTERN = /^\+?\d{7,15}$/;
