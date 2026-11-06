import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-sans/latin-700.css';
import './index.css';

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Ask installed offline workers to check the dev-only replacement now.
  // Merely unregistering from a fresh page cannot fix an already-cached page.
  void navigator.serviceWorker.getRegistrations().then(registrations =>
    Promise.all(registrations.map(registration => registration.update().catch(error => {
      console.warn('Preview update check failed', error);
    }))),
  );
}

// Precache the offline shell after fonts and first rendering have settled.
// Installing a multi-megabyte cache during first paint stalls low-end phones.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void document.fonts.ready.then(() => {
      const register = () => {
        void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(error => {
          console.error('Offline installation failed', error);
        });
      };
      if ('requestIdleCallback' in window) window.requestIdleCallback(register, { timeout: 10_000 });
      else setTimeout(register, 0);
    });
  }, { once: true });
}

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
