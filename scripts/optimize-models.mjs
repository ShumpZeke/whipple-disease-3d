// Compress the Blender-exported GLBs for the web:
// dedup -> prune (keeps named anchor nodes) -> reorder -> quantize -> EXT_meshopt_compression.
//
// Usage: node scripts/optimize-models.mjs [rawDir]
//   rawDir defaults to ../whipple-asset-work/out (output of tools/blender/build_models.py)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, prune, quantize, reorder } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = resolve(process.argv[2] ?? join(root, '..', 'whipple-asset-work', 'out'));
const outDir = join(root, 'public', 'models');
mkdirSync(outDir, { recursive: true });

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const models = ['digestive', 'heart', 'brain', 'knee'];
for (const name of models) {
  const src = join(rawDir, `${name}_raw.glb`);
  if (!existsSync(src)) {
    console.warn(`skip ${name}: ${src} not found`);
    continue;
  }
  const doc = await io.read(src);
  await doc.transform(
    dedup(),
    prune({ keepLeaves: true, keepAttributes: true }),
    reorder({ encoder: MeshoptEncoder, target: 'size' }),
    quantize({
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeColor: 8,
      quantizeGeneric: 12,
    }),
  );
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({
    method: EXTMeshoptCompression.EncoderMethod.FILTER,
  });
  const dst = join(outDir, `${name}.glb`);
  await io.write(dst, doc);
  const kb = (p) => (statSync(p).size / 1024).toFixed(0);
  console.log(`${name}: ${kb(src)} KB -> ${kb(dst)} KB`);
}
