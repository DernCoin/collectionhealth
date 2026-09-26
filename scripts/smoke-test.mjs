import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const empty = () => {};
class ElementStub {
  constructor() {
    this.hidden = true;
    this.classList = { add: empty, remove: empty };
  }
  addEventListener(type, handler) { this[`on${type}`] = handler; }
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
globalThis.confirm = () => true;

await import('../src/main.js');

assert.match(app.innerHTML, /Good morning, Marian/);
assert.match(app.innerHTML, /Start with your first collection/);
assert.doesNotMatch(app.innerHTML, /Adult Fiction|Young Adult|Nonfiction/);
assert.equal(typeof elementFor('#manage').onclick, 'function');

const index = await readFile('index.html', 'utf8');
assert.match(index, /<div id="app">/);
assert.match(index, /<script>[\s\S]+function bindEvents\(\)/);
assert.doesNotMatch(index, /<script[^>]+src=/);
assert.match(index, /trailingYearCheckouts/);
assert.doesNotMatch(index, /starterCollections|defaultRecords/);

const source = await readFile('src/main.js', 'utf8');
const storedCollections = [{ id: 'test', name: 'Test', code: 'T', size: 100 }];
const storedRecords = Array.from({ length: 13 }, (_, index) => ({
  id: `test-${index}`,
  collectionId: 'test',
  month: `${2025 + Math.floor((index + 1) / 12)}-${String((index + 1) % 12 + 1).padStart(2, '0')}`,
  checkouts: 10,
}));
const context = {
  localStorage: {
    getItem: key => JSON.stringify(key === 'shelf-insight-collections' ? storedCollections : storedRecords),
    setItem: empty,
  },
  Intl,
  Date,
};
vm.runInNewContext(`${source.replace(/render\(\);\s*$/, '')}\nglobalThis.result = turnover(collections[0], '2026-02');`, context);
assert.equal(context.result, 1.2, 'turnover uses the last 12 months of checkouts and current item count');

console.log('Dashboard renders empty by default with inline collection management.');
