import { dbBubbleToRuntimeBubble, runtimeBubbleToDbInsert } from '../../features/arena/utils/arenaMappers.js';

export async function findPublishedArenaByInviteCode({ supabase, inviteCode }) {
  return supabase
    .from('arenas')
    .select('*')
    .eq('invite_code', inviteCode)
    .eq('is_active', true)
    .eq('status', 'published')
    .maybeSingle();
}

export async function findArenaByInviteCode({ supabase, inviteCode }) {
  return supabase.from('arenas').select('id,status,is_active').eq('invite_code', inviteCode).maybeSingle();
}

export async function listArenaBubblesByArenaId({ supabase, arenaId }) {
  const { data, error } = await supabase.from('arena_bubbles').select('*').eq('arena_id', arenaId);
  return { data: (data || []).map(dbBubbleToRuntimeBubble), error };
}

export async function insertArena({ supabase, arena }) {
  return supabase.from('arenas').insert(arena).select('*').single();
}

export async function updateArenaStatus({ supabase, arenaId, ownerId, status, isActive }) {
  return supabase
    .from('arenas')
    .update({ status, is_active: isActive })
    .eq('id', arenaId)
    .eq('owner_id', ownerId)
    .select('*')
    .single();
}

export async function listArenaBubbles({ supabase, arenaId }) {
  return listArenaBubblesByArenaId({ supabase, arenaId });
}

export async function createArenaBubble({ supabase, arenaId, userId, bubble }) {
  const { data, error } = await supabase
    .from('arena_bubbles')
    .insert(runtimeBubbleToDbInsert({ arenaId, userId, bubble }))
    .select('*')
    .single();
  return { data: data ? dbBubbleToRuntimeBubble(data) : null, error };
}

export async function updateArenaBubble({ supabase, arenaId, bubbleId, dbPatch }) {
  const { data, error } = await supabase
    .from('arena_bubbles')
    .update(dbPatch)
    .eq('arena_id', arenaId)
    .eq('id', bubbleId)
    .select('*')
    .single();
  return { data: data ? dbBubbleToRuntimeBubble(data) : null, error };
}

export async function deleteArenaBubble({ supabase, arenaId, bubbleId }) {
  const { error } = await supabase.from('arena_bubbles').delete().eq('arena_id', arenaId).eq('id', bubbleId);
  return { data: !error, error };
}
