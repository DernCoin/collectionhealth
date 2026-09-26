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
const elements = new Map();
const elementFor = (selector) => {
  if (selector === '#app') return app;
  if (!elements.has(selector)) elements.set(selector, new ElementStub());
  return elements.get(selector);
};
globalThis.document = {
  body: new ElementStub(),
  querySelector: elementFor,
  querySelectorAll: () => [],
};
globalThis.localStorage = { getItem: () => null, setItem: empty };
globalThis.alert = empty;
globalThis.prompt = () => null;

await import('../src/main.js');

assert.match(app.innerHTML, /Good morning, Marian/);
assert.match(app.innerHTML, /Collection performance/);
assert.equal(typeof elementFor('#add-data').onclick, 'function');
elementFor('#add-data').onclick();
assert.equal(elementFor('#modal').hidden, false);

const index = await readFile('index.html', 'utf8');
assert.match(index, /<div id="app">[\s\S]+Good morning, Marian/);
assert.match(index, /<script>[\s\S]+function bindEvents\(\)/);
assert.doesNotMatch(index, /<script[^>]+src=/);
assert.match(index, /href="#collections"/);

console.log('Dashboard renders with inline interactions and visible fallback content.');
