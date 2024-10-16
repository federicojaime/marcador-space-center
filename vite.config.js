import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/en-20/', // Asegúrate de que el base sea esta ruta
});
