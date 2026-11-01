// The plugin as one file, main.js, which Obsidian loads. `obsidian` is the app's own, and is left out. grooph's
// drawing comes from the `grooph` package (package.json), bundled in.
import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/main.ts",
  external: ["obsidian"],
  platform: "browser",
  output: { file: "main.js", format: "cjs", codeSplitting: false, sourcemap: false, comments: false, minify: true },
});
