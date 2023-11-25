/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild')
const { nodeExternalsPlugin } = require('esbuild-node-externals')
esbuild
  .build({
    entryPoints: ['./src/command.ts', './src/plugin.ts'],
    outdir: 'dist',
    // outfile: 'dist/index.js',
    bundle: true,
    minify: false,
    treeShaking: true,
    platform: 'node',
    format: 'esm',
    target: 'node14',
    plugins: [nodeExternalsPlugin()]
  })
  .catch(() => process.exit(1))
