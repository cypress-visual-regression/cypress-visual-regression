/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild')
const { nodeExternalsPlugin } = require('esbuild-node-externals')
esbuild
  .build({
    entryPoints: ['./src/command.ts', './src/plugin.ts'],
    outdir: 'dist',
    bundle: true,
    minify: false,
    treeShaking: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    external: ['require', 'fs', 'path'],
    plugins: [nodeExternalsPlugin()]
  })
  .catch(() => process.exit(1))
