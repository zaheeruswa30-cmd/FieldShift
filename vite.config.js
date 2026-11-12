import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // read every .env key, not only VITE_*
  // One Google ID is enough: GOOGLE_CLIENT_ID or VITE_GOOGLE_CLIENT_ID both work for the web app too.
  const gid = (env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');
  return {
    plugins: [react()],
    define: { 'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(gid) },
    server: { port: 5173, open: true, proxy: { '/api': 'http://localhost:3001' } },
  };
});
