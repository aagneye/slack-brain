import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Bundle workspace packages; keep npm dependencies external for Node ESM runtime. */
const externalizeNodeModules = {
  name: 'externalize-node-modules',
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.path.startsWith('@cpe/')) return null;
      if (args.path.startsWith('.') || path.isAbsolute(args.path)) return null;
      if (args.path.startsWith('node:')) return { path: args.path, external: true };
      return { path: args.path, external: true };
    });
  },
};

await esbuild.build({
  entryPoints: [path.join(__dirname, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: path.join(__dirname, 'dist/index.js'),
  plugins: [externalizeNodeModules],
  sourcemap: true,
  logLevel: 'info',
});
