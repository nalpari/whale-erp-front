import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// 순수 유틸/로직 단위 테스트용 최소 설정.
// 컴포넌트(DOM) 테스트가 필요해지면 environment: 'jsdom' + @vitejs/plugin-react 추가.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    // tsconfig의 "@/*" → "./src/*" 경로 별칭을 테스트에서도 동일하게 해석.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
