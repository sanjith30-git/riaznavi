import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000,
    host: true,
    open: true
  },
  assetsInclude: ['**/*.mp4', '**/*.jpg', '**/*.jpeg', '**/*.png']
});
