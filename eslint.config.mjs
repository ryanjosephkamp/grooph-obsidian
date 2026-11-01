import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  // The tests run in Node, never in Obsidian, and are not part of the plugin.
  { ignores: ["main.js", "node_modules/", "test/"] },
  ...obsidianmd.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ["eslint.config.mjs", "rolldown.config.mjs"] },
      },
    },
  },
]);
