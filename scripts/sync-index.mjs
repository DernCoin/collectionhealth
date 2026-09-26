import { readFile, writeFile } from 'node:fs/promises';

const javascript = await readFile('src/main.js', 'utf8');
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f7f5f0" />
    <title>Shelf Insight — Collection Health</title>
    <meta name="description" content="Track circulation, turnover, and collection health over time." />
    <link rel="stylesheet" href="./src/styles.css" />
  </head>
  <body>
    <div id="app"><noscript>Shelf Insight requires JavaScript to manage your collection data.</noscript></div>
    <script>
${javascript}
    </script>
  </body>
</html>
`;

await writeFile('index.html', html);
console.log('Synchronized inline application in index.html.');
