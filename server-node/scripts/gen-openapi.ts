// Regenerate the OpenAPI golden contract both archetypes test against.
// Run: npm run gen:openapi
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openApiDoc } from '../src/openapi';

const out = fileURLToPath(new URL('../openapi.golden.json', import.meta.url));
writeFileSync(out, JSON.stringify(openApiDoc(), null, 2) + '\n');
console.log(`wrote ${out}`);
