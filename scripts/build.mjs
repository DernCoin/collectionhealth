import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/src', { recursive: true });
const index = await readFile('index.html', 'utf8');
const javascript = await readFile('src/main.js', 'utf8');
const synchronizedIndex = index.replace(/<script>[\s\S]*<\/script>/, `<script>\n${javascript}\n    </script>`);
await Promise.all([
  writeFile('dist/index.html', synchronizedIndex),
  cp('src/main.js', 'dist/src/main.js'),
  cp('src/styles.css', 'dist/src/styles.css'),
]);

console.log('Built static site in dist/');
