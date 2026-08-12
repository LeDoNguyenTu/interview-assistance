import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  plugins: [tailwindcss()],
  server: {
    port: 1420,
    strictPort: true,
  },
});
