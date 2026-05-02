import { useMemo } from 'react';
import { extractRoomSlugFromUrl } from '../utils/roomLink';

export function useRoomParam() {
  return useMemo(() => {
    if (typeof window === 'undefined') return '';
    const searchParams = new URLSearchParams(window.location.search);
    return extractRoomSlugFromUrl(searchParams);
  }, []);
}
