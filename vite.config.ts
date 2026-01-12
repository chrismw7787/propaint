import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [
      react(),
      VitePWA({
        // 'auto' allows Vite to automatically inject the correct sw.js script into index.html
        injectRegister: 'auto', 
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        // We define the manifest here so Vite generates it correctly during build
        manifest: {
          name: "ProPaint Estimator",
          short_name: "ProPaint",
          description: "Professional Paint Estimating App",
          start_url: "/",
          display: "standalone",
          background_color: "#f8fafc",
          theme_color: "#0f172a",
          orientation: "portrait",
          icons: [
            {
              src: "/icon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any maskable"
            }
          ]
        },
        workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY)
    }
  };
});