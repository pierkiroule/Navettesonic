const GUEST_IDENTITY_KEY = 'navettesonic.guestIdentity';
const ROOM_PSEUDOS_KEY = 'navettesonic.roomPseudos';

function safeJsonParse(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

export function getOrCreateGuestIdentity() {
  const stored = safeJsonParse(localStorage.getItem(GUEST_IDENTITY_KEY), null);
  if (stored?.id) return stored;
  const identity = { id: `guest_${Math.random().toString(36).slice(2, 10)}`, createdAt: new Date().toISOString() };
  localStorage.setItem(GUEST_IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

export function getStoredGuestPseudo({ roomSlug }) {
  const map = safeJsonParse(localStorage.getItem(ROOM_PSEUDOS_KEY), {});
  return map?.[String(roomSlug || '').toUpperCase()] || '';
}

export function saveGuestPseudo({ roomSlug, pseudo }) {
  const key = String(roomSlug || '').toUpperCase();
  const map = safeJsonParse(localStorage.getItem(ROOM_PSEUDOS_KEY), {}) || {};
  map[key] = pseudo;
  localStorage.setItem(ROOM_PSEUDOS_KEY, JSON.stringify(map));
}

export function normalizeGuestPseudo(pseudo) {
  return String(pseudo || '').trim().replace(/\s+/g, ' ');
}

export function validateGuestPseudo(pseudo) {
  const normalized = normalizeGuestPseudo(pseudo);
  if (!normalized) return { ok: false, reason: 'Pseudo invalide' };
  if (normalized.length < 2) return { ok: false, reason: 'Pseudo trop court' };
  if (normalized.length > 24) return { ok: false, reason: 'Pseudo trop long' };
  if (!/^[\p{L}\p{N}_ -]+$/u.test(normalized)) return { ok: false, reason: 'Pseudo invalide' };
  return { ok: true, value: normalized };
}
