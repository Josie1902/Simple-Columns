import { createMarkdownColumns } from 'src/ui/createColumns';
import { MarkdownRenderer, Plugin } from 'obsidian';
import { CustomiseColumnsModal } from 'src/ui/columnModal';	
import { DEFAULT_SETTINGS, ColumnsPluginSettings, ColumnWidthsSettingTab } from 'src/ui/settings';
import { createCustomiseButton } from 'src/ui/button';


export default class ColumnsPlugin extends Plugin {
	markdownRenderer: any;
	settings: ColumnsPluginSettings

	async onload() {

		// Load columns from command palette
		this.addCommand({
    	  id: "two-columns",
    	  name: "Add 2 Columns",
    	  callback: () => {
    	   createMarkdownColumns(this.app, 2);
    	  }
    	});

    	this.addCommand({
    	  id: "three-columns",
    	  name: "Add 3 Columns",
    	  callback: () => {
    	    createMarkdownColumns(this.app, 3);
    	  }
    	});

    	this.addCommand({
    	  id: "four-columns",
    	  name: "Add 4 Columns",
    	  callback: () => {
    	    createMarkdownColumns(this.app, 4);
    	  }
    	});

		// Menu item to create columns on the current line
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				menu.addItem((item) => {
					item.setTitle('Add Columns')
					item.setIcon('between-vertical-end')

					const submenu = item.setSubmenu();

					submenu.addItem((subItem) => {
						subItem.setTitle('2 Columns')
							.setIcon('columns-2')
							.onClick(() => {
								createMarkdownColumns(this.app, 2)
							});
					});

					submenu.addItem((subItem) => {
						subItem.setTitle('3 Columns')
							.setIcon('columns-3')
							.onClick(() => {
								createMarkdownColumns(this.app, 3)
							});
					});

					submenu.addItem((subItem) => {
						subItem.setTitle('4 Columns')
							.setIcon('columns-4')
							.onClick(() => {
								createMarkdownColumns(this.app, 4)
							});
					});
				}
				);
			})
		);

		// Apply styles to the columns based on settings
		await this.loadSettings();
		const columnSettingsTab = new ColumnWidthsSettingTab(this.app, this)
  		this.addSettingTab(columnSettingsTab);
		columnSettingsTab.applyStyles();

		// Render the columns for both read and live preview modes
		this.registerMarkdownCodeBlockProcessor("columns", async (source, el, ctx) => {
			const parts = source.split(/^===$/m);

			// Extract id from yaml
			const metadataSection = parts[0].trim();
			const idMatch = metadataSection.match(/^id:\s*(.+)$/m);
			if (!idMatch || !idMatch[1]) {
				throw new Error("No 'id' found in columns code block metadata.");
			}
			const blockId = idMatch[1].trim();
			
			// Render yaml as HTML container for the columns
			const container = document.createElement("div");
			container.className = `markdown-columns-resizable`;
			container.id = blockId
			
			// Load custom styles from localStorage - set via column settings modal
			const storageKey = `column-widths-${blockId}`;
			const savedWidths = localStorage.getItem(storageKey);
			const columnWidths: string[] = savedWidths ? JSON.parse(savedWidths) : [];	

			const savedAlignments = localStorage.getItem(`columnAlignments-${blockId}`);
			const columnAlignments: Record<number, "left" | "center" | "right"> = savedAlignments ? JSON.parse(savedAlignments) : {};

			const savedBackgrounds = localStorage.getItem(`columnBackgrounds-${blockId}`);	
			const columnBackgrounds: Record<number, string> = savedBackgrounds ? JSON.parse(savedBackgrounds) : {};
			
			const savedTextColors = localStorage.getItem(`columnTextColors-${blockId}`);	
			const columnTextColors: Record<number, string> = savedTextColors ? JSON.parse(savedTextColors) : {};

			const borderData = JSON.parse(localStorage.getItem(`borderColor-${blockId}`) || '{}');
			const savedBorderColor = borderData.color;
			const showBorder = borderData.show;
			if (savedBorderColor) {
				// prevents clashing with global border style
				container.style.borderColor = showBorder ? savedBorderColor : "transparent";
				container.style.borderStyle = "solid";
			}

			const resizerData = JSON.parse(localStorage.getItem(`resizerColor-${blockId}`) || '{}');
			const savedResizerColor = resizerData.color;
			const showResizer = resizerData.show;	

			// Create HTML structure for columns
			for (let i = 1; i < parts.length; i++) {
				const col = document.createElement("div");
				col.className = "column";
				col.dataset.index = (i).toString();

				const align = columnAlignments[i] ?? "left";
				col.style.textAlign = align;

				const bg = columnBackgrounds[i] || "var(--background-primary)";
				col.style.backgroundColor = bg;

				const textColor = columnTextColors[i] || "var(--text-normal)";
				col.style.color = textColor;
			
				const width = columnWidths[i-1] || "auto";
				col.style.flexBasis = width;
			
				await MarkdownRenderer.render(
					this.app,
					parts[i].trim(),
					col,
					ctx.sourcePath,
					this
				);
				container.appendChild(col);

				if (savedResizerColor) {
					var css = `.markdown-columns-resizable[id="${blockId}"] > .column-resizer:hover{ background-color: ${savedResizerColor} !important; }`;
					var hoverStyle = document.createElement('style');
					document.head.appendChild(hoverStyle);
					hoverStyle.textContent = css;	
				}

				if (i < parts.length - 1) {
					const resizer = document.createElement("div");
					resizer.className = "column-resizer";

					if (savedResizerColor) {
						resizer.style.backgroundColor = showResizer ? savedResizerColor : "transparent";
						resizer.style.display = "block";
					}

					container.appendChild(resizer);
				
					let isDragging = false;
				
					let startX: number;
					let startPrevWidth: number;
					let startNextWidth: number;
					
					// Get columns and their widths
					resizer.addEventListener("mousedown", (e) => {
						isDragging = true;
						document.body.style.cursor = "col-resize";
						startX = e.clientX;
					
						const prevCol = resizer.previousElementSibling as HTMLElement;
						const nextCol = resizer.nextElementSibling as HTMLElement;
					
						startPrevWidth = prevCol.getBoundingClientRect().width;
						startNextWidth = nextCol.getBoundingClientRect().width;
					
						e.preventDefault();
					});

					// Update column widths while dragging
					document.addEventListener("mousemove", (e) => {
						if (!isDragging) return;
					
						const dx = e.clientX - startX;
						const containerWidth = container.getBoundingClientRect().width;
					
						const prevCol = resizer.previousElementSibling as HTMLElement;
						const nextCol = resizer.nextElementSibling as HTMLElement;
					
						const newPrev = startPrevWidth + dx;
						const newNext = startNextWidth - dx;

						if (newPrev < 50 || newNext < 50) {
							// Prevent columns from becoming too small
							return;
						}

						const percentPrev = (newPrev / containerWidth) * 100;
						const percentNext = (newNext / containerWidth) * 100;
					
						prevCol.style.flexBasis = `${percentPrev}%`;
						nextCol.style.flexBasis = `${percentNext}%`;
					});

					
					// Stop dragging when mouse is released
					// This will save the current widths to localStorage
					document.addEventListener("mouseup", () => {
						if (isDragging) {
							isDragging = false;
							document.body.style.cursor = "";
						
							const widths = Array.from(container.querySelectorAll(".column")).map(
								(col: any) => col.style.flexBasis || "auto"
							);
							localStorage.setItem(storageKey, JSON.stringify(widths));
						}
					});
				}
			}

			// Add a button to customise the columns within the code block
			const parent = el.parentElement;
  			if (parent && 
				parent.className.includes("cm-preview-code-block")) {	
				const customiseButton = createCustomiseButton(container)
				customiseButton.addEventListener("click", () => {
					new CustomiseColumnsModal(this.app, this, blockId, parts.length - 1, columnAlignments, columnBackgrounds, columnTextColors).open();
				});
				parent.appendChild(customiseButton);
			}
			
			// Add the columns container to the rendered element
			el.appendChild(container);
		});
	}

	async loadSettings() {
    	this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  	}

  	async saveSettings() {
    	await this.saveData(this.settings);
  	}	
}