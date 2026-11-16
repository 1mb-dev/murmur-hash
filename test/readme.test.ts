import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import * as mod from '../src/index.ts';

// Runs each README js block and asserts every `expr; // <literal>` line, so a wrong
// documented value fails here. A comment that does not start with a literal is prose.
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const blocks = [...readme.matchAll(/```js\n([\s\S]*?)```/g)].map((m) => m[1]);
const CHECK = /^(?<code>\S.*?);?\s*\/\/\s*(?<value>-?\d+n?|'[^']*')(?:\s*[,=].*)?$/;

let total = 0;

blocks.forEach((block, i) => {
  let checks = 0;
  const body = block
    .split('\n')
    .filter((line) => !/^import .* from 'murmur-hash';$/.test(line))
    .map((line) => {
      const m = CHECK.exec(line);
      if (!m) return line;
      checks++;
      const { code, value } = m.groups!;
      return `__check(${code}, ${value}, ${JSON.stringify(code)});`;
    })
    .join('\n');
  if (checks === 0) return;
  total += checks;

  test(`README block ${i + 1}: documented values`, () => {
    const run = new Function('mod', '__check', `const { ${Object.keys(mod).join(', ')} } = mod;\n${body}`);
    run(mod, (actual: unknown, expected: unknown, code: string) => {
      assert.strictEqual(actual, expected, code);
    });
  });
});

test('README: documented values were found', () => {
  assert.ok(total >= 10, `only ${total} documented values`);
});
