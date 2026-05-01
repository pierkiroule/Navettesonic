import { buildRoomUrl, generateRoomSlug, normalizeRoomSlug } from '../utils/roomLink.js';
import { dbBubbleToRuntimeBubble, runtimeBubbleToDbInsert, runtimeBubbleToDbPatch } from '../utils/arenaMappers.js';

const fail = (message, details = null) => ({ data: null, error: { message, details } });
const ok = (data) => ({ data, error: null });

export async function loadPublicArenaByCode({ supabase, inviteCode }) {
  if (!supabase) return fail('Connexion Supabase requise.');
  const code = normalizeRoomSlug(inviteCode);
  if (!code) return fail('Lien de visite invalide.');
  const { data, error } = await supabase
    .from('arenas')
    .select('*')
    .eq('invite_code', code)
    .eq('is_active', true)
    .eq('status', 'published')
    .maybeSingle();
  if (error) return fail(error.message, error);
  if (!data) return fail('Ce paysage sonore est introuvable ou n’est plus disponible.');
  return ok(data);
}

export async function loadPublicArenaBubbles({ supabase, arenaId }) {
  if (!supabase) return fail('Connexion Supabase requise.');
  if (!arenaId) return fail('Arène invalide.');
  const { data, error } = await supabase.from('arena_bubbles').select('*').eq('arena_id', arenaId);
  if (error) return fail(error.message, error);
  return ok((data || []).map(dbBubbleToRuntimeBubble));
}

export async function createHostArena({ supabase, userId, title }) {
  if (!supabase) return fail('Multiutilisateur indisponible : connexion Supabase requise.');
  if (!userId) return fail('Connexion requise');
  for (let i = 0; i < 5; i += 1) {
    const invite_code = generateRoomSlug();
    const { data, error } = await supabase
      .from('arenas')
      .insert({ owner_id: userId, invite_code, title: title || 'Mon arène', status: 'draft', is_active: true })
      .select('*')
      .single();
    if (error?.code === '23505') continue;
    if (error) return fail(error.message, error);
    return ok(data);
  }
  return fail('Impossible de générer un code unique');
}

export async function publishArena({ supabase, arenaId, userId, origin }) {
  if (!supabase) return fail('Connexion Supabase requise.');
  if (!arenaId || !userId) return fail('Arène ou utilisateur invalide.');
  const { data, error } = await supabase
    .from('arenas')
    .update({ status: 'published', is_active: true })
    .eq('id', arenaId)
    .eq('owner_id', userId)
    .select('*')
    .single();
  if (error) return fail(error.message, error);
  const roomSlug = normalizeRoomSlug(data?.invite_code);
  return ok({ arena: data, roomSlug, visitorUrl: buildRoomUrl({ origin: origin || window.location.origin, roomSlug }) });
}

export async function archiveArena({ supabase, arenaId, userId }) {
  if (!supabase) return fail('Connexion Supabase requise.');
  if (!arenaId || !userId) return fail('Arène ou utilisateur invalide.');
  const { data, error } = await supabase
    .from('arenas')
    .update({ status: 'archived', is_active: false })
    .eq('id', arenaId)
    .eq('owner_id', userId)
    .select('*')
    .single();
  return error ? fail(error.message, error) : ok(data);
}

export async function listArenaBubbles({ supabase, arenaId }) { const { data, error } = await supabase.from('arena_bubbles').select('*').eq('arena_id', arenaId); return error ? fail(error.message, error) : ok((data || []).map(dbBubbleToRuntimeBubble)); }
export async function createArenaBubble({ supabase, arenaId, userId, bubble }) { const { data, error } = await supabase.from('arena_bubbles').insert(runtimeBubbleToDbInsert({ arenaId, userId, bubble })).select('*').single(); return error ? fail(error.message, error) : ok(dbBubbleToRuntimeBubble(data)); }
export async function updateArenaBubble({ supabase, arenaId, bubbleId, patch }) { const { data, error } = await supabase.from('arena_bubbles').update(patch).eq('arena_id', arenaId).eq('id', bubbleId).select('*').single(); return error ? fail(error.message, error) : ok(dbBubbleToRuntimeBubble(data)); }
export async function deleteArenaBubble({ supabase, arenaId, bubbleId }) { const { error } = await supabase.from('arena_bubbles').delete().eq('arena_id', arenaId).eq('id', bubbleId); return error ? fail(error.message, error) : ok(true); }

export { runtimeBubbleToDbPatch };

export async function createArena(args) {
  return createHostArena(args);
}
