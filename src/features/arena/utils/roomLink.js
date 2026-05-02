const ROOM_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function normalizeRoomSlug(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, '');
}

export function generateRoomSlug(length = 10) {
  const size = Number.isFinite(length) && length > 0 ? Math.floor(length) : 10;
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => ROOM_ALPHABET[b % ROOM_ALPHABET.length]).join('');
  }
  let output = '';
  for (let i = 0; i < size; i += 1) {
    output += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
  }
  return output;
}

export function buildRoomUrl(args) {
  const origin = typeof args === 'object' ? args.origin : window.location.origin;
  const roomSlug = typeof args === 'object' ? args.roomSlug : args;
  const safeSlug = normalizeRoomSlug(roomSlug);
  const url = new URL(origin || window.location.origin);
  url.searchParams.set('room', safeSlug);
  return url.toString();
}

export function buildHubloUrl(args) {
  const origin = typeof args === 'object' ? args.origin : window.location.origin;
  const roomSlug = typeof args === 'object' ? args.roomSlug : args;
  const safeSlug = normalizeRoomSlug(roomSlug);
  const url = new URL(origin || window.location.origin);
  url.searchParams.set('hublo', safeSlug);
  return url.toString();
}

export function extractRoomSlugFromUrl(searchParams) {
  if (!searchParams) return '';
  const normalized = normalizeRoomSlug(
    searchParams.get('hublo') || searchParams.get('room') || searchParams.get('arenaInvite') || '',
  );
  if (normalized.length < 7) return '';
  return normalized;
}
