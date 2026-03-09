/**
 * Build an SMS URI that works on both iOS and Android.
 * Uses `sms:NUMBER?&body=MESSAGE` which is compatible with both platforms.
 */
export function buildSmsUri(phone: string, body: string): string {
  return `sms:${encodeURIComponent(phone)}?&body=${encodeURIComponent(body)}`;
}
