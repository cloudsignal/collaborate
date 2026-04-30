import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: false,
    clean: true,
    minify: false,
    treeshake: true,
    target: 'es2020',
    platform: 'browser',
    external: ['react', 'react-dom', '@cloudsignal/mqtt-client'],
    outExtension({ format }) {
      return format === 'esm' ? { js: '.js' } : { js: '.cjs' }
    },
    banner: {
      js: `/**
 * @cloudsignal/collaborate v0.1.1
 * Real-time collaboration primitives for React
 * https://cloudsignal.io
 * MIT License
 */`,
    },
  },
])
