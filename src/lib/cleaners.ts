export const PLACEHOLDER_VALUES = new Set([
  '',
  'ไม่ระบุ',
  'อื่น ๆ',
  'อื่นๆ',
  '-',
  '–',
  '—',
  'ไม่มี',
  'ไม่มื',
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
]);

export function isPlaceholder(value: unknown) {
  const text = String(value ?? '').trim();
  return PLACEHOLDER_VALUES.has(text) || PLACEHOLDER_VALUES.has(text.toLowerCase());
}

export function cleanText(value: unknown) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return isPlaceholder(text) ? null : text;
}

export function cleanMultilineText(value: unknown) {
  const text = String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();
  return isPlaceholder(text) ? null : text;
}

export function cleanEmail(value: unknown) {
  const text = cleanText(value);
  return text ? text.toLowerCase() : null;
}

export function cleanPhone(value: unknown) {
  const text = cleanText(value);
  if (!text) return null;
  let digits = text.replace(/[\s\-()]/g, '').replace(/\D/g, '');
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

export function cleanArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter((item): item is string => Boolean(item));
  }
  const text = cleanText(value);
  return text ? text.split(',').map(cleanText).filter((item): item is string => Boolean(item)) : [];
}
