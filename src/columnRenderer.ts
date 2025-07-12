import { MarkdownRenderChild } from "obsidian";

export class ColumnRenderer extends MarkdownRenderChild {
	constructor(
		public containerEl: HTMLElement,
		public blockId: string
	) {
		super(containerEl);
	}

	onunload() {
		document.getElementById(`sc-resizer-hover-style-${this.blockId}`)?.remove();
	}
}
