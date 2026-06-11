/** Strip control characters and angle brackets from user-authored plain text. */
const CONTROL_CHARS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\uFEFF]/g;

const HTML_TAG = /<[^>]*>/g;

export function sanitizePlainText(
  input: string,
  options?: { maxLength?: number },
): string {
  let text = input.normalize("NFC").replace(CONTROL_CHARS, "").replace(HTML_TAG, "");

  if (options?.maxLength !== undefined) {
    text = text.slice(0, options.maxLength);
  }

  return text.trim();
}

export function sanitizeOptionalPlainText(
  input: string | null | undefined,
  options?: { maxLength?: number },
): string | null {
  if (input === null || input === undefined) {
    return null;
  }

  const sanitized = sanitizePlainText(input, options);
  return sanitized.length > 0 ? sanitized : null;
}
