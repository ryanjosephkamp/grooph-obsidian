// The README's examples are drawn as the plugin draws them.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { readBlock } from "../src/block.ts";

test("every grooph block in the README is drawn, with the options it shows", async () => {
  const { render } = await import("grooph/browser");
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const blocks = [...readme.matchAll(/```grooph\n([\s\S]*?)```/g)].map((m) => m[1]!);
  assert.equal(blocks.length, 2);
  const [full] = blocks;
  const { options, json } = readBlock(full!);
  const drawn = render(json, options);
  assert.match(drawn.svg, /^<svg [^>]*data-picture="graph"/);
  assert.match(render(json, { view: "stairs" }).svg, /data-picture="space"/);
  // The second shows where options go, around an elided document: it reads as an option and a document.
  assert.deepEqual(readBlock(blocks[1]!).options, { view: "stairs" });
});
