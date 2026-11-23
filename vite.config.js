import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true, // listen on the network too, so phones and other PCs can open http://<this-pc-ip>:3001
  },
})
