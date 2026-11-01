/**
 * What a ```grooph block says: optional lines of options (`view: stairs`, `layout: phone`, `theme: ink`), then a
 * graph's or an operation map's JSON. And the link that opens the same document in the grooph app.
 */

export type BlockOptions = { view?: string; layout?: "wide" | "phone"; theme?: string };

/** grooph's named picture themes, besides Paper. */
const NAMED = ["blueprint", "ink", "phosphor", "transit", "chalk"];

/**
 * The theme to draw in, with the app's light or dark: a named theme with no form of its own (`ink`) takes Obsidian's,
 * not the system's, which can differ. Anything else is left as it is: Paper, which the plugin's style sheet gives
 * Obsidian's own colors; a form alone (`light`, `dark`, `auto`); a theme held to one form; and a name grooph does not
 * know, so that its error names it as it was written.
 */
export function themeFor(theme: string | undefined, dark: boolean): string | undefined {
  return theme !== undefined && NAMED.includes(theme) ? `${theme}-${dark ? "dark" : "light"}` : theme;
}

const KEYS = ["view", "layout", "theme"] as const;

/** The block's options and its document's text. An unknown option is said, so a typo is not drawn as if it were right. */
export function readBlock(source: string): { options: BlockOptions; json: string } {
  const lines = source.split("\n");
  const options: BlockOptions & Record<string, string> = {};
  let at = 0;
  for (; at < lines.length; at++) {
    const line = lines[at].trim();
    if (line === "") continue;
    const option = /^([a-z]+)\s*:\s*([A-Za-z-]+)\s*$/.exec(line);
    if (!option) break;
    const [, key, value] = option;
    if (!(KEYS as readonly string[]).includes(key)) throw new Error(`"${key}" is not an option of a grooph block: view, layout or theme.`);
    options[key] = value;
  }
  return { options, json: lines.slice(at).join("\n") };
}

/** Where a link opens the document: the grooph app. */
export const APP = "https://ryanjosephkamp.github.io/grooph/";

/** The longest link payload the grooph app opens, in characters, and the most it unpacks to, in bytes. */
export const PAYLOAD_MAX = 1_000_000;
export const UNPACKED_MAX = 4_000_000;

/**
 * The share link the grooph app opens (`#/open?d=`): the document as a share envelope, raw DEFLATE, base64url, with a
 * graph's run notes left out, as the app's own links leave them. The document travels after the `#`, which a
 * browser sends to no server. Undefined when the text is not a document, or when the link is larger than the app
 * opens, packed or unpacked.
 */
export async function shareLink(json: string): Promise<string | undefined> {
  let doc: unknown;
  try {
    doc = JSON.parse(json);
  } catch {
    return undefined;
  }
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) return undefined;
  const kind = "groophMap" in doc ? "map" : "grooph" in doc ? "graph" : undefined;
  if (kind === undefined) return undefined;
  const { notes: _notes, ...rest } = doc as Record<string, unknown>;
  const envelope = new Blob([JSON.stringify({ v: 1, kind, doc: kind === "graph" ? rest : doc })]);
  if (envelope.size > UNPACKED_MAX) return undefined;
  const packed = envelope.stream().pipeThrough(new CompressionStream("deflate-raw"));
  const bytes = new Uint8Array(await new Response(packed).arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const payload = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return payload.length > PAYLOAD_MAX ? undefined : `${APP}#/open?d=${payload}`;
}
