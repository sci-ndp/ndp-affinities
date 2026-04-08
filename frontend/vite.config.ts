import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Base path is injected at runtime via entrypoint.sh, so we always build with '/'
export default defineConfig({
  plugins: [react()],
  base: '/',
})
