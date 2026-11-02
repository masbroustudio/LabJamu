import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import youcamHandler from './api/youcam-proxy.ts'
import nimHandler from './api/nim-proxy.ts'

/**
 * Local API Middleware Plugin:
 * Directly routes /api/youcam-proxy and /api/nim-proxy inside the Vite dev server,
 * so you don't need a separate port 3000 process during local development.
 */
function localApiMiddleware(env: Record<string, string>): Plugin {
  return {
    name: 'local-api-middleware',
    configureServer(server) {
      for (const [k, v] of Object.entries(env)) {
        process.env[k] = v
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/api/youcam-proxy' && url !== '/api/nim-proxy') {
          return next()
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
        }
        const rawBody = Buffer.concat(chunks).toString('utf-8')
        let parsedBody = {}
        if (rawBody) {
          try {
            parsedBody = JSON.parse(rawBody)
          } catch (e) {
            console.warn('[Vite Dev API] Could not parse JSON body:', e)
          }
        }

        const adaptedReq: any = req
        adaptedReq.body = parsedBody

        const adaptedRes: any = res
        adaptedRes.status = (statusCode: number) => {
          adaptedRes.statusCode = statusCode
          return adaptedRes
        }
        adaptedRes.json = (data: any) => {
          adaptedRes.setHeader('Content-Type', 'application/json')
          adaptedRes.end(JSON.stringify(data))
          return adaptedRes
        }

        try {
          if (url === '/api/youcam-proxy') {
            await youcamHandler(adaptedReq, adaptedRes)
          } else if (url === '/api/nim-proxy') {
            await nimHandler(adaptedReq, adaptedRes)
          }
        } catch (err: any) {
          console.error(`[Vite Dev API Error] ${url}:`, err)
          if (!adaptedRes.headersSent) {
            adaptedRes.statusCode = 500
            adaptedRes.setHeader('Content-Type', 'application/json')
            adaptedRes.end(JSON.stringify({ error: err.message || 'Internal dev proxy error' }))
          }
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      localApiMiddleware(env),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
        manifest: {
          name: 'LabJamu — Mesin Bukti Kausalitas',
          short_name: 'LabJamu',
          description: 'Validasi efikasi perawatan herbal kulit dengan AI & analisis kausalitas on-device',
          theme_color: '#1B4332',
          background_color: '#FDFBF7',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
              handler: 'NetworkFirst',
              options: { cacheName: 'weather-cache', expiration: { maxAgeSeconds: 60 * 30 } },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
    server: {
      port: 5173,
    },
  }
})
