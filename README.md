# grooph

Draw workflow diagrams in your notes. A `grooph` code block that holds a grooph document, a graph or an operation map, is drawn as its picture: the same drawing the grooph app and its command line make.

````markdown
```grooph
{
  "grooph": 0,
  "id": "review",
  "name": "Review",
  "version": 1,
  "nodes": [
    { "id": "draft", "kind": "agent", "name": "Draft", "role": "builder", "brief": "Write it.", "outputs": ["DRAFT.md"] },
    { "id": "edit", "kind": "agent", "name": "Edit", "role": "critic", "brief": "Read it against the outline.", "outputs": ["NOTES.md"] },
    { "id": "done", "kind": "stop", "name": "Done" }
  ],
  "edges": [
    { "id": "e1", "from": "draft", "to": "edit" },
    { "id": "e2", "from": "edit", "to": "draft", "when": "fail" },
    { "id": "e3", "from": "edit", "to": "done", "when": "pass" }
  ],
  "loops": [{ "id": "rounds", "name": "Rounds", "members": ["draft", "edit"], "back": ["e2"], "stops": [{ "kind": "max-iterations", "n": 3 }] }]
}
```
````

## Install

From Obsidian:

1. Open **Settings**, then **Community plugins**, and turn off Restricted mode if it is on.
2. Select **Browse**, search for **grooph**, and select **Install**, then **Enable**.

By hand:

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/ryanjosephkamp/grooph-obsidian/releases/latest).
2. Copy them into `<vault>/.obsidian/plugins/grooph/`. The folder name is the `id` in `manifest.json`, `grooph`; create it if it is missing.
3. In Obsidian, reload the plugins list (or restart the app), then enable **grooph** under **Settings**, **Community plugins**.

The plugin works on desktop and on mobile.

## Use

Write a fenced code block whose language is `grooph`, and put a grooph document in it, as in the example above. The block is drawn in place of its text, in Reading view and in Live Preview. Open the note in Source mode to see and edit the text.

The plugin adds no commands and has no settings. Everything is set in the block itself, with the options below. The drawing:

- follows your Obsidian theme's colors, in light and in dark, unless the block names a `theme`;
- changes between the phone and wide layouts as the pane is resized, unless the block names a `layout`;
- shows a message in place of the drawing when the block cannot be drawn.

## Options

Lines before the document set how it is drawn:

````markdown
```grooph
view: stairs
{ "grooph": 0, … }
```
````

- `view`: a 3D still, `stairs`, `panes`, `spiral`, `rings`, or `columns`; for an operation map, `stairs` or `sequence`.
- `layout`: `phone` or `wide`. Without it, a pane narrower than 640 pixels gets the phone layout, and one 680 pixels or wider the wide layout; between the two, a drawing keeps the layout it has.
- `theme`: one of grooph's picture themes, `blueprint`, `ink`, `phosphor`, `transit`, or `chalk`. It follows Obsidian's light and dark; add `-light` or `-dark` (`ink-dark`) to hold it to one. Without a theme, the drawing takes its colors from your Obsidian theme, in light and in dark.

A block that cannot be drawn says why, in place of the drawing: text that is not JSON, a document grooph does not read, an option it does not know, or a diagram over grooph's size limits (500 nodes and 2,000 edges for a graph; 200 sessions and 1,000 handoffs for a map).

## Making a document

Draw one in the grooph app at https://ryanjosephkamp.github.io/grooph/ and copy it, write one with the `grooph` command line, or ask an agent. The documents are described at https://ryanjosephkamp.github.io/grooph/docs/graph-ir/.

## Privacy

The plugin makes no network requests and sends no telemetry. It reads only the code blocks it draws, and changes no note.

Under each drawing, **Open in grooph** opens the same document in the grooph app in your browser, and only when you follow it. The document travels in the link after its `#`, which a browser sends to no server. A graph's run notes are left out of the link, and a document too large for a link gets none.

## License

MIT. See `LICENSE`.
