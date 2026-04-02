export function normalize(text = '') {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}