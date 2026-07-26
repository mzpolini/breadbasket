import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Native tsconfig `paths` resolution — vitest 4 supersedes vite-tsconfig-paths.
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // The domain modules are pure logic — no DOM, no React.
    // Add @vitejs/plugin-react and a jsdom environment when component tests arrive.
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
})
