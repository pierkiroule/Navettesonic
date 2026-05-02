import { buildRoomUrl, generateRoomSlug, normalizeRoomSlug } from '../utils/roomLink.js';
import { runtimeBubbleToDbPatch } from '../utils/arenaMappers.js';
import {
  findPublishedArenaByInviteCode,
  listArenaBubblesByArenaId,
  insertArena,
  updateArenaStatus,
  listArenaBubbles as repoListArenaBubbles,
  createArenaBubble as repoCreateArenaBubble,
  updateArenaBubble as repoUpdateArenaBubble,
  deleteArenaBubble as repoDeleteArenaBubble,
} from '../../../integrations/supabase/arenaRepository.js';

const fail = (message, details = null) => ({ data: null, error: { message, details } });
const ok = (data) => ({ data, error: null });

export async function loadPublicArenaByCode({ supabase, inviteCode }) {
  if (!supabase) return fail('Connexion Supabase requise.');
  const code = normalizeRoomSlug(inviteCode);
  if (!code) return fail('Lien de visite invalide.');
  const { data, error } = await findPublishedArenaByInviteCode({ supabase, inviteCode: code });
  if (error) return fail(error.message, error);
  if (!data) return fail('Ce paysage sonore est introuvable ou n’est plus disponible.');
  return ok(data);
}

export async function loadPublicArenaBubbles({ supabase, arenaId }) {
  if (!supabase) return fail('Connexion Supabase requise.');
  if (!arenaId) return fail('Arène invalide.');
  const { data, error } = await listArenaBubblesByArenaId({ supabase, arenaId });
  if (error) return fail(error.message, error);
  return ok(data);
}

export async function createHostArena({ supabase, userId, title }) {
  if (!supabase) return fail('Multiutilisateur indisponible : connexion Supabase requise.');
  if (!userId) return fail('Connexion requise');
  for (let i = 0; i < 5; i += 1) {
    const invite_code = generateRoomSlug();
    const { data, error } = await insertArena({
      supabase,
      arena: { owner_id: userId, invite_code, title: title || 'Mon arène', status: 'draft', is_active: true },
    });
    if (error?.code === '23505') continue;
    if (error) return fail(error.message, error);
    return ok(data);
  }
  return fail('Impossible de générer un code unique');
}

export async function publishArena({ supabase, arenaId, userId, origin }) {
  if (!supabase) return fail('Connexion Supabase requise.');
  if (!arenaId || !userId) return fail('Arène ou utilisateur invalide.');
  const { data, error } = await updateArenaStatus({ supabase, arenaId, ownerId: userId, status: 'published', isActive: true });
  if (error) return fail(error.message, error);
  const roomSlug = normalizeRoomSlug(data?.invite_code);
  return ok({ arena: data, roomSlug, visitorUrl: buildRoomUrl({ origin: origin || window.location.origin, roomSlug }) });
}

export async function archiveArena({ supabase, arenaId, userId }) {
  if (!supabase) return fail('Connexion Supabase requise.');
  if (!arenaId || !userId) return fail('Arène ou utilisateur invalide.');
  const { data, error } = await updateArenaStatus({ supabase, arenaId, ownerId: userId, status: 'archived', isActive: false });
  return error ? fail(error.message, error) : ok(data);
}

export async function listArenaBubbles({ supabase, arenaId }) {
  const { data, error } = await repoListArenaBubbles({ supabase, arenaId });
  return error ? fail(error.message, error) : ok(data);
}

export async function createArenaBubble({ supabase, arenaId, userId, bubble }) {
  const { data, error } = await repoCreateArenaBubble({ supabase, arenaId, userId, bubble });
  return error ? fail(error.message, error) : ok(data);
}

export async function updateArenaBubble({ supabase, arenaId, bubbleId, patch, bubble }) {
  const dbPatch = runtimeBubbleToDbPatch(bubble || {}, patch);
  const { data, error } = await repoUpdateArenaBubble({ supabase, arenaId, bubbleId, dbPatch });
  return error ? fail(error.message, error) : ok(data);
}

export async function deleteArenaBubble({ supabase, arenaId, bubbleId }) {
  const { data, error } = await repoDeleteArenaBubble({ supabase, arenaId, bubbleId });
  return error ? fail(error.message, error) : ok(data);
}

export { runtimeBubbleToDbPatch };

export async function createArena(args) {
  return createHostArena(args);
}
