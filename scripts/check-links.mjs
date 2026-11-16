// Fails when the page or content.json points at a local file that is not in the repo.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const content = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));

const isLocal = ref => ref && !/^(?:[a-z]+:|\/\/|#)/i.test(ref);
const refs = new Set();
for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) if (isLocal(match[1])) refs.add(match[1]);
for (const match of html.matchAll(/import\(["']([^"']+)["']\)/g)) refs.add(match[1]);
(function collect(node) {
  if (Array.isArray(node)) node.forEach(collect);
  else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'src' && typeof value === 'string' && isLocal(value)) refs.add(value);
      else collect(value);
    }
  }
})(content);

const missing = [...refs].filter(ref => !fs.existsSync(path.join(root, decodeURI(ref.split(/[?#]/)[0]))));
if (missing.length) {
  console.error('Missing local files:\n' + missing.map(ref => '  ' + ref).join('\n'));
  process.exit(1);
}
console.log(`All ${refs.size} local references resolve.`);
