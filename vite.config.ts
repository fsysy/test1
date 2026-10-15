import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// 상대 경로 base: GitHub Pages 하위 경로(/<repo>/)에서도 그대로 동작한다.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 2500 },
  test: { environment: 'node', include: ['test/**/*.test.ts'] },
})
