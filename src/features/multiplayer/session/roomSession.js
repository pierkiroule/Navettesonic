import { generateInviteCode, normalizeInviteCode } from '../../arena/utils/inviteCode.js';

const MULTIPLAYER_SHARE_BASE_URL = 'https://navettesonic.vercel.app/';

export function createMultiplayerRoomSession() {
  const inviteCode = generateInviteCode(8);
  return {
    inviteCode,
    arenaId: `room-${inviteCode.toLowerCase()}`,
    createdAt: new Date().toISOString(),
  };
}

export function buildDedicatedRoomLink(inviteCode, options = {}) {
  const safeCode = normalizeInviteCode(inviteCode);
  const url = new URL(MULTIPLAYER_SHARE_BASE_URL);
  url.searchParams.set('arenaInvite', safeCode);
  if (options.guestMode) url.searchParams.set('guest', '1');
  return url.toString();
}
