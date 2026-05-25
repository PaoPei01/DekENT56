export function joinDisplayParts(parts: Array<string | null | undefined>, separator = ' ') {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(separator);
}
