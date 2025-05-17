module.exports = {
  main: {
    entryPoints: ['electron/main.ts'],
    outfile: 'electron/main.js',
    external: ['electron'],
    platform: 'node',
    target: 'node16',
    format: 'cjs',
    bundle: true,
    sourcemap: 'inline',
  },
  preload: {
    entryPoints: ['electron/preload.ts'],
    outfile: 'electron/preload.js',
    external: ['electron'],
    platform: 'node',
    target: 'node16',
    format: 'cjs',
    bundle: true,
    sourcemap: 'inline',
  },
};
