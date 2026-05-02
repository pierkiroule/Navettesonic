import { ArenaEditorPage } from '../../features/arena/pages/ArenaEditorPage';
import { ArenaVisitorPage } from '../../features/arena/pages/ArenaVisitorPage';
import LegacyShell from '../../features/legacy/components/LegacyShell';
import { HomeLandingPage } from './HomeLandingPage';

function getRouteContext() {
  if (typeof window === 'undefined') {
    return { route: 'home', legacyMode: false };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const legacyMode = searchParams.get('legacy') === '1';

  if (legacyMode) {
    return { route: 'legacy', legacyMode: true };
  }

  const path = window.location.pathname.toLowerCase();

  if (path === '/editor') {
    return { route: 'editor', legacyMode: false };
  }

  if (path === '/visitor') {
    return { route: 'visitor', legacyMode: false };
  }

  return { route: 'home', legacyMode: false };
}

export function AppRouter() {
  const { route } = getRouteContext();

  if (route === 'legacy') {
    return <LegacyShell />;
  }

  if (route === 'editor') {
    return <ArenaEditorPage />;
  }

  if (route === 'visitor') {
    return <ArenaVisitorPage />;
  }

  return <HomeLandingPage />;
}
