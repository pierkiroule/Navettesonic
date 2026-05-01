const INVITE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function normalizeInviteCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, '');
}

export function generateInviteCode(length = 6) {
  const size = Number.isFinite(length) && length > 0 ? Math.floor(length) : 6;
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join('');
  }
  let output = '';
  for (let i = 0; i < size; i += 1) {
    output += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return output;
}
