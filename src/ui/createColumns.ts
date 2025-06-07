import { App, MarkdownView } from 'obsidian';
import { v4 as uuidv4 } from "uuid";

export function createMarkdownColumns(app: App, columnCount: number) {
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) return;

	const blockId = uuidv4();

	let content = "```columns\n";
	content += `id: ${blockId}\n`;
	content += "===\n";

	for (let i = 1; i <= columnCount; i++) {
		content += `Column ${i}\n\n`;
		if (i < columnCount) content += `===\n`;
	}
	
	content += "```\n";

	view.editor.replaceSelection(content);
}
