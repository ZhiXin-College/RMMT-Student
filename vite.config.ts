import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/** 本地开发：把 /api 转到 Flask（默认 5001，与 RMMT-API/app.py 一致） */
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5001'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      // 登录页背景、头像等 Flask 静态资源（未设置 VITE_API_URL 时走相对路径）
      '/static': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
