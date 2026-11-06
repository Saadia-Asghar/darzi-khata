import path from 'path';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

// Production releases identify their source, not just the build clock.
const revision = (() => {
  // Library/checkpoint metadata-only commits do not identify app source.
  try { return execFileSync('git', ['log', '-1', '--format=%h', '--abbrev=8', '--', '.'], { cwd: import.meta.dirname, encoding: 'utf8' }).trim(); }
  catch { return 'source-unknown'; }
})();
export default defineConfig({
  base: basePath,
  define: {
    __DARZI_BUILD__: JSON.stringify(`1.5.0+${revision}.${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}Z`),
  },
  plugins: [
    {
      name: 'refresh-cached-preview',
      apply: 'serve',
      configureServer(server) {
        // Worker updates bypass the old worker's navigation cache. Replacing
        // sw.js lets already-cached tabs recover, not just fresh browsers.
        server.middlewares.use((req, res, next) => {
          if (req.url?.split('?')[0] !== `${basePath}sw.js`) return next();
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'no-store, max-age=0');
          res.end(readFileSync(path.resolve(import.meta.dirname, 'dev-preview-worker.js'), 'utf8'));
        });
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        id: `${basePath}app`,
        name: 'Darzi Khata. درزی کھاتہ',
        short_name: 'Darzi Khata',
        description: 'Offline khata for tailors: orders, payments and an illustrative credit profile.',
        // Installed app opens the register, not the landing page.
        start_url: `${basePath}app`,
        scope: basePath,
        display: 'standalone',
        background_color: '#F9FAF9',
        theme_color: '#155B43',
        lang: 'ur',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Landing screenshots are fetched on demand, not installed with the app.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        globIgnores: ['**/screens/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: `${basePath}index.html`,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          { urlPattern: /^https:\/\/fonts\.googleapis\.com\//, handler: 'StaleWhileRevalidate', options: { cacheName: 'darzi-font-css' } },
          { urlPattern: /^https:\/\/fonts\.gstatic\.com\//, handler: 'CacheFirst', options: { cacheName: 'darzi-fonts', expiration: { maxEntries: 15, maxAgeSeconds: 31536000 }, cacheableResponse: { statuses: [0, 200] } } },
        ],
      },
      devOptions: { enabled: false },
    }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    // Keep the landing route lean: the signed-in shell, auth and data layers
    // stay in their own lazy chunks (see src/App.tsx).
    modulePreload: { resolveDependencies: (_file, deps, ctx) => ctx.hostType === 'html' ? deps.filter(d => !/signed-in-app|app-shell|dashboard/.test(d)) : deps },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
