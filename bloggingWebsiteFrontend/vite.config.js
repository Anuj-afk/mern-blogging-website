import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base:"/mern-blogging-website/",
  server: {
        historyApiFallback: true, // Handles routing for client-side applications
  },
})
