// What a grooph block says, and the link it offers. The drawing itself is grooph's, tested where it is built.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { inflateRawSync } from "node:zlib";

import { APP, PAYLOAD_MAX, UNPACKED_MAX, readBlock, shareLink, themeFor } from "../src/block.ts";

// A graph: the README's own example. The plugin's tests read only what is in the plugin's folder.
const graph = /```grooph\n([\s\S]*?)```/.exec(readFileSync(new URL("../README.md", import.meta.url), "utf8"))![1]!;

test("a block is its options, one a line, and then the document", () => {
  assert.deepEqual(readBlock(graph), { options: {}, json: graph });
  assert.deepEqual(readBlock(`view: stairs\nlayout: phone\n\ntheme: ink-dark\n${graph}`), { options: { view: "stairs", layout: "phone", theme: "ink-dark" }, json: graph });
  assert.throws(() => readBlock(`veiw: stairs\n${graph}`), /^Error: "veiw" is not an option of a grooph block: view, layout or theme\.$/);
  // A document whose first line looks like an option is still read as the document from its first brace.
  assert.equal(readBlock('{"grooph": 0}').json, '{"grooph": 0}');
});

test("the link opens the same document in the app: a share envelope, raw DEFLATE, base64url, after the #", async () => {
  const href = await shareLink(graph);
  assert.ok(href?.startsWith(`${APP}#/open?d=`), href);
  const payload = href!.slice(`${APP}#/open?d=`.length);
  assert.match(payload, /^[A-Za-z0-9_-]+$/);
  const envelope = JSON.parse(inflateRawSync(Buffer.from(payload, "base64url")).toString("utf8")) as { v: number; kind: string; doc: unknown };
  assert.deepEqual(envelope, { v: 1, kind: "graph", doc: JSON.parse(graph) });
  const map = JSON.stringify({ groophMap: 0, id: "studio", name: "Studio", version: 1, sessions: [], handoffs: [] });
  assert.equal(JSON.parse(inflateRawSync(Buffer.from((await shareLink(map))!.split("d=")[1]!, "base64url")).toString("utf8")).kind, "map");
  for (const text of ["{ not json", "[]", '{"name": "x"}', "null"]) assert.equal(await shareLink(text), undefined, text);
});

test("a graph's run notes stay out of the link, and a document too large for one gets none", async () => {
  const withNotes = JSON.stringify({ ...JSON.parse(graph), notes: [{ at: "2026-10-28T12:00:00Z", node: "draft", note: "private" }] });
  const href = (await shareLink(withNotes))!;
  const envelope = JSON.parse(inflateRawSync(Buffer.from(href.split("d=")[1]!, "base64url")).toString("utf8")) as { doc: Record<string, unknown> };
  assert.equal("notes" in envelope.doc, false);
  assert.deepEqual(envelope.doc, JSON.parse(graph));
  // Words that do not compress: a link of them is longer than the app opens.
  let noise = "";
  for (let i = 0; noise.length < PAYLOAD_MAX * 1.2; i++) noise += ((i * 2654435761) >>> 0).toString(36);
  assert.equal(await shareLink(JSON.stringify({ ...JSON.parse(graph), name: noise })), undefined);
  assert.ok(await shareLink(JSON.stringify({ ...JSON.parse(graph), name: noise.slice(0, PAYLOAD_MAX / 2) })), "half as many words make a link");
  // Words that compress well: a short link, but one that unpacks to more than the app reads.
  assert.equal(await shareLink(JSON.stringify({ ...JSON.parse(graph), goal: "a".repeat(UNPACKED_MAX) })), undefined);
  assert.ok(await shareLink(JSON.stringify({ ...JSON.parse(graph), goal: "a".repeat(UNPACKED_MAX - 4_000) })), "a little less makes a link");
});

test("a named theme takes Obsidian's light or dark; Paper, the forms alone, a theme held to one, and an unknown name are left as they are", () => {
  assert.equal(themeFor("ink", true), "ink-dark");
  assert.equal(themeFor("ink", false), "ink-light");
  for (const theme of [undefined, "paper", "light", "dark", "auto", "ink-dark", "chalk-light", "ink-auto", "neon"]) assert.equal(themeFor(theme, true), theme, String(theme));
});
