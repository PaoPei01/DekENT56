export type ParsedContact = {
  line_id: string;
  instagram: string;
  facebook: string;
  phone: string;
  other_contact: string;
};

const phoneRegex = /(?:\+66|0)[689]\d{8}\b/g;
const instagramRegex = /(?:ig|instagram)\s*[:=@]?\s*([A-Za-z0-9._]{2,30})|@([A-Za-z0-9._]{2,30})/i;
const lineRegex = /(?:line|ไลน์)\s*[:=@]?\s*([A-Za-z0-9._-]{2,40})/i;
const facebookRegex = /(?:facebook|fb)\s*[:=@]?\s*([A-Za-z0-9._/-]{2,80})/i;

const clean = (value?: string) => value?.trim().replace(/^[:=@\s]+/, '').trim() ?? '';

export function parseContact(contact: string | null | undefined): ParsedContact {
  const text = contact ?? '';
  const phones = text.match(phoneRegex) ?? [];
  const lineMatch = text.match(lineRegex);
  const instagramMatch = text.match(instagramRegex);
  const facebookMatch = text.match(facebookRegex);

  const parsed: ParsedContact = {
    line_id: clean(lineMatch?.[1]),
    instagram: clean(instagramMatch?.[1] ?? instagramMatch?.[2]),
    facebook: clean(facebookMatch?.[1]),
    phone: phones[0] ?? '',
    other_contact: '',
  };

  let other = text;
  for (const value of Object.values(parsed)) {
    if (value) other = other.replace(value, '');
  }
  other = other
    .replace(phoneRegex, '')
    .replace(/(?:line|ไลน์|LINE|ig|instagram|facebook|fb)\s*[:=@]?/gi, '')
    .replace(/[;,|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  parsed.other_contact = other;
  return parsed;
}
