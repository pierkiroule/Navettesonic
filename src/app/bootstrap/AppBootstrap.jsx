import React from 'react';
import { AppProviders } from '../providers/AppProviders';
import { AppRouter } from '../routing/AppRouter';

export function AppBootstrap() {
  return (
    <React.StrictMode>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </React.StrictMode>
  );
}
