import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabaseClient } from '../../../integrations/supabase/client/supabaseClient';
import {
  createArenaBubble,
  createHostArena,
  deleteArenaBubble,
  publishArena,
  updateArenaBubble,
} from '../services/arenaService';
import { arenaDomainService } from '../services/arenaDomainService';
import { buildRoomUrl, generateRoomSlug } from '../utils/roomLink';

const createFeedback = (type, message, code = null) => ({ type, message, code });

const getBusinessErrorMessage = (error) => {
  if (!error) return 'Une erreur inconnue est survenue.';
  if (error.code) return `Erreur métier (${error.code}) : ${error.message}`;
  return `Erreur métier : ${error.message}`;
};

const createLocalBubble = (patch = {}) => ({ id: crypto.randomUUID(), label: 'Nouvelle bulle', x: 50, y: 50, size: 80, ...patch });

export function useArenaEditor() {
  const [bubbles, setBubbles] = useState([]);
  const [status, setStatus] = useState(arenaDomainService.ARENA_STATUSES.DRAFT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  const [arena, setArena] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setIsProcessing(true);
      setFeedback(createFeedback('loading', 'Chargement : initialisation de l’éditeur…'));

      const authResult = await supabaseClient.auth.getUser();
      const ownerId = authResult?.data?.user?.id;
      if (!ownerId) {
        if (isMounted) {
          setIsProcessing(false);
          setFeedback(createFeedback('success', 'Mode local actif : connectez-vous pour activer la publication cloud.', 'local-mode'));
        }
        return;
      }

      const arenaResult = await createHostArena({ supabase: supabaseClient, userId: ownerId, title: 'Mon arène' });
      if (!isMounted) return;
      if (arenaResult.error) {
        setIsProcessing(false);
        setFeedback(createFeedback('error', getBusinessErrorMessage(arenaResult.error), arenaResult.error.code));
        return;
      }

      setUserId(ownerId);
      setArena(arenaResult.data);
      setIsProcessing(false);
      setFeedback(createFeedback('success', 'Éditeur prêt : arène brouillon créée.'));
    }

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const addBubble = useCallback(async (bubblePatch = {}) => {
    const bubble = createLocalBubble(bubblePatch);

    if (!arena?.id || !userId) {
      setBubbles((prev) => [...prev, bubble]);
      return;
    }

    setIsProcessing(true);
    const result = await createArenaBubble({ supabase: supabaseClient, arenaId: arena.id, userId, bubble });
    if (result.error) {
      setFeedback(createFeedback('error', getBusinessErrorMessage(result.error), result.error.code));
      setIsProcessing(false);
      return;
    }
    setBubbles((prev) => [...prev, result.data]);
    setFeedback(createFeedback('success', 'Bulle créée.'));
    setIsProcessing(false);
  }, [arena?.id, userId]);

  const updateBubble = useCallback(async (bubbleId, patch) => {
    if (!bubbleId) return;
    const bubble = bubbles.find((item) => item.id === bubbleId);
    if (!bubble) return;

    if (!arena?.id) {
      setBubbles((prev) => prev.map((item) => (item.id === bubbleId ? { ...item, ...patch } : item)));
      return;
    }

    setIsProcessing(true);
    const result = await updateArenaBubble({ supabase: supabaseClient, arenaId: arena.id, bubbleId, patch, bubble });
    if (result.error) {
      setFeedback(createFeedback('error', getBusinessErrorMessage(result.error), result.error.code));
      setIsProcessing(false);
      return;
    }
    setBubbles((prev) => prev.map((item) => (item.id === bubbleId ? { ...item, ...patch } : item)));
    setIsProcessing(false);
  }, [arena?.id, bubbles]);

  const removeBubble = useCallback(async (bubbleId) => {
    if (!bubbleId) return;

    if (!arena?.id) {
      setBubbles((prev) => prev.filter((item) => item.id !== bubbleId));
      return;
    }

    setIsProcessing(true);
    const result = await deleteArenaBubble({ supabase: supabaseClient, arenaId: arena.id, bubbleId });
    if (result.error) {
      setFeedback(createFeedback('error', getBusinessErrorMessage(result.error), result.error.code));
      setIsProcessing(false);
      return;
    }
    setBubbles((prev) => prev.filter((item) => item.id !== bubbleId));
    setFeedback(createFeedback('success', 'Bulle supprimée.'));
    setIsProcessing(false);
  }, [arena?.id]);

  const publish = useCallback(async () => {
    if (bubbles.length === 0) {
      setFeedback(createFeedback('error', 'Erreur métier (arena-empty) : ajoutez au moins une bulle avant la publication.', 'arena-empty'));
      return;
    }

    if (!arena?.id || !userId) {
      const localVisitorUrl = buildRoomUrl({ origin: window.location.origin, roomSlug: generateRoomSlug(10) });
      setInviteLink(localVisitorUrl);
      setStatus(arenaDomainService.ARENA_STATUSES.PUBLISHED);
      setFeedback(createFeedback('success', 'Mode local : lien de visite généré pour prévisualisation.', 'local-preview'));
      return;
    }

    setIsProcessing(true);
    setFeedback(createFeedback('loading', 'Chargement : publication en cours...'));
    const result = await publishArena({ supabase: supabaseClient, arenaId: arena.id, userId, origin: window.location.origin });
    if (result.error) {
      setFeedback(createFeedback('error', getBusinessErrorMessage(result.error), result.error.code));
      setIsProcessing(false);
      return;
    }

    setStatus(arenaDomainService.ARENA_STATUSES.PUBLISHED);
    setInviteLink(result.data.visitorUrl || '');
    setIsProcessing(false);
    setFeedback(createFeedback('success', 'Publication réussie : votre arène est maintenant disponible en lecture.'));
  }, [arena?.id, bubbles.length, userId]);

  return useMemo(() => ({ bubbles, status, isProcessing, feedback, inviteLink, addBubble, updateBubble, removeBubble, publish, setFeedback }), [bubbles, status, isProcessing, feedback, inviteLink, addBubble, updateBubble, removeBubble, publish]);
}
