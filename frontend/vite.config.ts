import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3003,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GATEWAY_URL': JSON.stringify(env.GATEWAY_URL),
      'process.env.FRONTEND_URL': JSON.stringify(env.FRONTEND_URL),
      'process.env.GATEWAY_ADDRESS': JSON.stringify(env.GATEWAY_ADDRESS),
      'process.env.EXECUTION_CONTRACT_ADDRESS': JSON.stringify(env.EXECUTION_CONTRACT_ADDRESS)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    allowedHosts: [
      ".ngrok-free.de",
      "localhost"
    ]
  };
});
