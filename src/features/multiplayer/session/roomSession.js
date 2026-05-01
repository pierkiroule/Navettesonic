import { customAlphabet } from 'nanoid/non-secure';

const buildCode = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);
const MULTIPLAYER_SHARE_BASE_URL = 'https://navettesonic.vercel.app/';

export function createMultiplayerRoomSession() {
  const inviteCode = buildCode();
  return {
    inviteCode,
    arenaId: `room-${inviteCode.toLowerCase()}`,
    createdAt: new Date().toISOString(),
  };
}

export function buildDedicatedRoomLink(inviteCode) {
  const safeCode = String(inviteCode || '').trim().toUpperCase();
  const url = new URL(MULTIPLAYER_SHARE_BASE_URL);
  url.searchParams.set('arenaInvite', safeCode);
  return url.toString();
}
