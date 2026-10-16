import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import { findSearchMatches } from "./search";
import { findSearchMatches as findAstroMatches } from "../../../../packages/astro/src/client/utils/search";

for (const [name, find] of [
  ["editor", findSearchMatches],
  ["astro", findAstroMatches],
] as const) {
  test(`${name}: regex matches retain actual lengths and advance past empty matches`, () => {
    assert.deepEqual(
      find("a abb", "a+", {
        regex: true,
        caseSensitive: false,
        wholeWord: false,
      }),
      [
        { index: 0, length: 1 },
        { index: 2, length: 1 },
      ]
    );
    assert.deepEqual(
      find("abc", "^|$", {
        regex: true,
        caseSensitive: false,
        wholeWord: false,
      }),
      [
        { index: 0, length: 0 },
        { index: 3, length: 0 },
      ]
    );
  });
  test(`${name}: whole-word alternatives stay grouped`, () => {
    assert.deepEqual(
      find("catfish dogmatic cat dog", "cat|dog", {
        regex: true,
        caseSensitive: false,
        wholeWord: true,
      }),
      [
        { index: 17, length: 3 },
        { index: 21, length: 3 },
      ]
    );
  });
}
