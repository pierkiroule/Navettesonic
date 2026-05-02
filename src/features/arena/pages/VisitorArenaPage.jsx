import { useEffect, useState } from 'react';
import { ArenaScene } from '../components/ArenaScene';
import { loadPublicArenaByCode, loadPublicArenaBubbles } from '../services/arenaService';
import { supabaseClient } from '../../../integrations/supabase/client';

export function VisitorArenaPage({ roomCode }) {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const arenaResult = await loadPublicArenaByCode({ supabaseClient, inviteCode: roomCode });
      const arenaId = arenaResult.data?.id;
      if (!arenaId) return;
      const bubbleResult = await loadPublicArenaBubbles({ supabaseClient, arenaId });
      if (mounted && bubbleResult.data) setBubbles(bubbleResult.data);
    };
    run();
    return () => { mounted = false; };
  }, [roomCode]);

  return <main className="arena-shell" style={{ padding: 24 }}><h1>Visiteur</h1><ArenaScene bubbles={bubbles} readonly /></main>;
}
