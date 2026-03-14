import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Cornerstone3D codec WASM modules are UMD/CJS — they lack ESM default exports.
// When the dicom-image-loader is excluded from optimizeDeps (needed so the
// web Worker(new URL(..., import.meta.url)) pattern resolves correctly),
// its imports of these codecs fail because Vite serves them raw.
// This plugin intercepts the codec resolve and serves an ESM wrapper.
function cornerstoneCodecPlugin(): Plugin {
  const codecModules = [
    '@cornerstonejs/codec-libjpeg-turbo-8bit/decodewasmjs',
    '@cornerstonejs/codec-openjpeg/decodewasmjs',
    '@cornerstonejs/codec-charls/decodewasmjs',
    '@cornerstonejs/codec-openjph/wasmjs',
  ]

  return {
    name: 'cornerstone-codec-esm-compat',
    enforce: 'pre',
    resolveId(source) {
      if (codecModules.includes(source)) {
        return `\0codec-esm:${source}`
      }
      return null
    },
    load(id) {
      if (id.startsWith('\0codec-esm:')) {
        const moduleName = id.slice('\0codec-esm:'.length)
        const resolved = require.resolve(moduleName)
        const code = readFileSync(resolved, 'utf-8')
        // Wrap the UMD module: execute it and export the result as default
        return `
var module = { exports: {} };
var exports = module.exports;
var define = undefined;
${code}
export default module.exports;
`
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), cornerstoneCodecPlugin()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@cornerstonejs/dicom-image-loader'],
    include: [
      '@cornerstonejs/core',
      '@cornerstonejs/tools',
      'dicom-parser',
    ],
  },
})
