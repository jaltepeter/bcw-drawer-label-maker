/// <reference types="vitest/config" />
import { readFileSync } from 'fs'
import { execSync } from 'child_process'
import { defineConfig } from 'vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))
function getGitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return ''
  }
}

const appVersion = process.env.VITE_APP_VERSION ?? pkg.version
const gitSha = process.env.VITE_GIT_SHA ?? getGitSha()

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __GIT_SHA__: JSON.stringify(gitSha),
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    globals: true,
  },
})
