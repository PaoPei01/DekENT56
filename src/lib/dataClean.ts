const placeholderValues = new Set([
  '',
  'ไม่ระบุ',
  'อื่น ๆ',
  '-',
  '—',
  'ไม่มี',
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
]);

export function isPlaceholderValue(value: unknown) {
  const text = String(value ?? '').trim();
  return placeholderValues.has(text) || placeholderValues.has(text.toLowerCase());
}

export function cleanNullableText(value: unknown) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return isPlaceholderValue(text) ? null : text;
}

export function normalizeNullableText(value: unknown) {
  return cleanNullableText(value);
}

export function normalizePhoneNumber(value: unknown) {
  const text = cleanNullableText(value);
  if (!text) return null;
  let digits = text.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0066') && digits.length > 4) {
    digits = `0${digits.slice(4)}`;
  } else if (digits.startsWith('66') && digits.length >= 10) {
    digits = `0${digits.slice(2)}`;
  } else if (!digits.startsWith('0') && digits.length === 9) {
    digits = `0${digits}`;
  }
  return digits;
}

export function cleanImportRow<T extends Record<string, unknown>>(row: T): T {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      typeof value === 'string' || value == null ? cleanNullableText(value) : value,
    ]),
  ) as T;
}
