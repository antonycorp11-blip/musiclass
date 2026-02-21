import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    plugins: [react()],
    build: {
      target: 'es2015',
    },
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://wayigtlilhvutbfvxgae.supabase.co'),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YP9wwSLwb5yIl6mX9ebAmg_IB3xDd4L'),
      'process.env.VITE_EMUSYS_API_KEY': JSON.stringify(env.EMUSYS_API_KEY || '4vb5JK9QS6YkhaA6JpIIxocrV3VuqU'),
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/emusys-api': {
          target: 'https://api.emusys.com.br',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/emusys-api/, '')
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
