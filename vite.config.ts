import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // HashRouter keeps app routes after "#", but Vite's base controls where built
  // JS/CSS assets are loaded from. GitHub Pages project sites live under /TFBP/,
  // while Cloudflare Pages root deployments live at /. A hardcoded /TFBP/ base
  // makes Cloudflare request /TFBP/assets/... and can render a blank page.
  const base =
    env.VITE_APP_BASE_PATH ||
    (env.VITE_DEPLOY_TARGET === 'github-pages' ? '/TFBP/' : '/');

  return {
    base,
    plugins: [react()],
  };
});
