import { cleanPhone, cleanText, isPlaceholder } from './cleaners';

export function isPlaceholderValue(value: unknown) {
  return isPlaceholder(value);
}

export function cleanNullableText(value: unknown) {
  return cleanText(value);
}

export function normalizeNullableText(value: unknown) {
  return cleanNullableText(value);
}

export function normalizePhoneNumber(value: unknown) {
  return cleanPhone(value);
}

export function cleanImportRow<T extends Record<string, unknown>>(row: T): T {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      typeof value === 'string' || value == null ? cleanNullableText(value) : value,
    ]),
  ) as T;
}
