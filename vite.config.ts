import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Use '/' for development, test, and Vercel, '/italian-flashcards/' only for GitHub Pages production build
  base: mode === 'development' || mode === 'test' || process.env.VERCEL ? '/' : '/italian-flashcards/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));
