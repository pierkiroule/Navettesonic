import { useMemo } from 'react';

export function useRoomParam() {
  return useMemo(() => {
    if (typeof window === 'undefined') return '';
    const value = new URLSearchParams(window.location.search).get('room') || '';
    return value.trim();
  }, []);
}
