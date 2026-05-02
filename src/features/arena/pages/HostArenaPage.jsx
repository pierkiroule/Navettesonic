import { useState } from 'react';
import { ArenaComposer } from '../components/ArenaComposer';
import { ArenaScene } from '../components/ArenaScene';
import { PublishPanel } from '../components/PublishPanel';
import { useArenaBubbles } from '../hooks/useArenaBubbles';
import { createHostArena, publishArena } from '../services/arenaService';
import { supabaseClient } from '../../../integrations/supabase/client';

export function HostArenaPage() {
  const { bubbles, createBubble } = useArenaBubbles([]);
  const [visitorUrl, setVisitorUrl] = useState('');
  const [arena, setArena] = useState(null);

  const onAdd = () => createBubble({ id: crypto.randomUUID(), label: 'Bulle', x: 0, y: 0 });

  const onPublish = async () => {
    let activeArena = arena;
    if (!activeArena) {
      const created = await createHostArena({ supabaseClient, userId: 'host-demo', title: 'Mon arène' });
      if (created.data) {
        activeArena = created.data;
        setArena(created.data);
      }
    }
    if (!activeArena) return;
    const publication = await publishArena({ supabaseClient, arenaId: activeArena.id, userId: 'host-demo', origin: window.location.origin });
    if (publication.data?.visitorUrl) setVisitorUrl(publication.data.visitorUrl);
  };

  return <main className="arena-shell" style={{ padding: 24 }}><ArenaComposer onAdd={onAdd} /><ArenaScene bubbles={bubbles} /><PublishPanel onPublish={onPublish} visitorUrl={visitorUrl} /></main>;
}
