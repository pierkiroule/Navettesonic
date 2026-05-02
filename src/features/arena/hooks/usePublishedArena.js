import { useEffect, useState } from 'react';
import { supabaseClient } from '../../../integrations/supabase/client/supabaseClient';
import { loadPublicArenaBubbles, loadPublicArenaByCode } from '../services/arenaService';

export function usePublishedArena(roomCode) {
  const [state, setState] = useState({ isLoading: Boolean(roomCode), arena: null, bubbles: [], error: null });

  useEffect(() => {
    let isMounted = true;

    async function loadArena() {
      if (!roomCode) {
        if (isMounted) setState({ isLoading: false, arena: null, bubbles: [], error: null });
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const arenaResult = await loadPublicArenaByCode({ supabase: supabaseClient, inviteCode: roomCode });
      if (!isMounted) return;
      if (arenaResult.error) {
        setState({ isLoading: false, arena: null, bubbles: [], error: arenaResult.error.message });
        return;
      }

      const bubblesResult = await loadPublicArenaBubbles({ supabase: supabaseClient, arenaId: arenaResult.data.id });
      if (!isMounted) return;
      if (bubblesResult.error) {
        setState({ isLoading: false, arena: arenaResult.data, bubbles: [], error: bubblesResult.error.message });
        return;
      }

      setState({ isLoading: false, arena: arenaResult.data, bubbles: bubblesResult.data, error: null });
    }

    loadArena();
    return () => {
      isMounted = false;
    };
  }, [roomCode]);

  return state;
}
