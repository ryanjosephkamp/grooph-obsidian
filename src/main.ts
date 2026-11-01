import { MarkdownRenderChild, Plugin, type App, type MarkdownPostProcessorContext } from "obsidian";
import { PHONE_BELOW, WIDE_FROM, render } from "grooph/browser";

import { readBlock, shareLink, themeFor, type BlockOptions } from "./block.ts";

/**
 * One block's drawing. Below 640 pixels it takes the phone layout and from 680 the wide one again, as grooph's own
 * drawings do; a named theme follows Obsidian's light and dark; and it is let go on unload.
 */
class Drawing extends MarkdownRenderChild {
  private watcher: ResizeObserver | undefined;
  private layout: "wide" | "phone" | undefined;
  private gone = false;

  constructor(
    private readonly app: App,
    holder: HTMLElement,
    private readonly source: string,
  ) {
    super(holder);
  }

  onload(): void {
    const box = this.containerEl.createDiv({ cls: "grooph-drawing" });
    let read: { options: BlockOptions; json: string };
    try {
      read = readBlock(this.source);
    } catch (err) {
      box.createEl("p", { cls: "grooph-error", text: (err as Error).message });
      return;
    }
    const fits = (): "wide" | "phone" => {
      if (read.options.layout) return read.options.layout;
      const width = box.clientWidth;
      if (width <= 0) return this.layout ?? "wide";
      return width < (this.layout === "phone" ? WIDE_FROM : PHONE_BELOW) ? "phone" : "wide";
    };
    /** Draws, and says whether it did. */
    const draw = (): boolean => {
      if (this.gone) return false;
      this.layout = fits();
      box.empty();
      try {
        const theme = themeFor(read.options.theme, box.doc.body.hasClass("theme-dark"));
        const { svg } = render(read.json, { ...read.options, ...(theme ? { theme } : {}), layout: this.layout } as Parameters<typeof render>[1]);
        // The drawing is parsed as SVG and added as an element: nothing of the document is set as HTML.
        const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
        if (parsed.getElementsByTagName("parsererror").length > 0) throw new Error("The drawing could not be read as SVG.");
        box.appendChild(box.doc.importNode(parsed.documentElement, true));
        return true;
      } catch (err) {
        box.createEl("p", { cls: "grooph-error", text: (err as Error).message });
        return false;
      }
    };
    if (!draw()) return;
    if (read.options.layout === undefined) {
      this.watcher = new ResizeObserver(() => void (fits() !== this.layout && draw()));
      this.watcher.observe(box);
    }
    // Obsidian's light and dark, for a named theme.
    if (themeFor(read.options.theme, true) !== read.options.theme) this.registerEvent(this.app.workspace.on("css-change", () => void draw()));
    // The one link out, under a drawing made: it opens the browser, and only when it is followed.
    shareLink(read.json)
      .then((href) => {
        if (href && !this.gone) this.containerEl.createEl("a", { cls: "external-link grooph-open", text: "Open in grooph", href, attr: { target: "_blank", rel: "noopener" } });
      })
      .catch(() => undefined);
  }

  onunload(): void {
    this.gone = true;
    this.watcher?.disconnect();
    this.watcher = undefined;
  }
}

export default class GroophPlugin extends Plugin {
  onload(): void {
    this.registerMarkdownCodeBlockProcessor("grooph", (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      el.addClass("grooph-block");
      ctx.addChild(new Drawing(this.app, el, source));
    });
  }
}
