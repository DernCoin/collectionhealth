import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const empty = () => {};
class ElementStub {
  constructor() {
    this.hidden = true;
    this.classList = { add: empty, remove: empty };
  }
  set innerHTML(value) { this.html = value; }
  get innerHTML() { return this.html || ''; }
  scrollIntoView() {}
}

const app = new ElementStub();
globalThis.document = {
  body: new ElementStub(),
  querySelector: (selector) => selector === '#app' ? app : new ElementStub(),
  querySelectorAll: () => [],
};
globalThis.localStorage = { getItem: () => null, setItem: empty };
globalThis.alert = empty;
globalThis.prompt = () => null;

await import('../src/main.js');

assert.match(app.innerHTML, /Good morning, Marian/);
assert.match(app.innerHTML, /Collection performance/);

const index = await readFile('index.html', 'utf8');
assert.match(index, /<div id="app">[\s\S]+Good morning, Marian/);
assert.match(index, /<script defer src="\.\/src\/main\.js"><\/script>/);

console.log('Dashboard renders and index contains visible fallback content.');
