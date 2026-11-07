
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const backendRoutes = [
  '/user',
  '/rooms',
  '/departments',
  '/specializations',
  '/diseases',
  '/drugs',
  '/doctors',
  '/patients',
  '/patient',
  '/doctor',
  '/schedule',
  '/appointments',
  '/medical-history',
  '/reports',
  '/api',
  '/api-auth',
  '/admin',
  '/swagger',
  '/static',
]

const proxy = Object.fromEntries(
  backendRoutes.map((route) => [
    route,
    {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    },
  ])
)

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy,
  },
})
