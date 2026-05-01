import { useMemo } from 'react';
import { extractRoomSlugFromUrl } from '../utils/roomLink';

export function useRoomSlugFromLocation(search = window.location.search) {
  return useMemo(() => {
    const params = new URLSearchParams(search || '');
    return extractRoomSlugFromUrl(params);
  }, [search]);
}
