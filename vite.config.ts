import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import nodePolyfills from 'vite-plugin-node-stdlib-browser'
// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'cypress-visual-regression',
      fileName: 'cypress-visual-regression'
    }
  },
  plugins: [
    nodePolyfills(),
    dts({
      tsconfigPath: 'tsconfig.build.json'
    })
  ]
})
