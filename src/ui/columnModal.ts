import { App, ButtonComponent, Modal, Notice, Setting } from "obsidian";
import { convertToRGBA, hexToRGBA, rgbToHex } from "./colorUtils";
import ColumnsPlugin from "main";

function clearBlockStyles(blockId: string, parts: number) {
	const container = document.querySelector(`.markdown-columns-resizable[id="${blockId}"]`);
	if (!container) return;

	for (let index = 1; index <= parts; index++) {
		const col = container.querySelector(`.column[data-index="${index}"]`) as HTMLElement;
		if (col) {
			col.removeAttribute("style");
		}
	}

	(container as HTMLElement).removeAttribute("style");
	if (container instanceof HTMLElement) {
        const dividers = container.querySelectorAll(".column-resizer");
        dividers.forEach(divider => {
            if (divider instanceof HTMLElement) {
				divider.removeAttribute("style");
            }
        });
    }
}

function applyColumnAlignmentStyles(blockId: string, alignments: Record<number, "left" | "center" | "right">) {
	for (const [index, align] of Object.entries(alignments)) {
        if (!align) continue; // Skip if no alignment is set
		const myDiv = document.querySelector(`.markdown-columns-resizable[id="${blockId}"] > .column[data-index="${index}"]`);
		if (myDiv instanceof HTMLElement) {
			myDiv.classList.remove("text-left", "text-center", "text-right");
			myDiv.classList.add(`text-${align}`);	
		}
	}
}

function applyColumnBackgroundStyles(blockId: string, backgrounds: Record<number, string>) {
    for (const [index, bgColor] of Object.entries(backgrounds)) {
        if (!bgColor) continue; // Skip if no background color is set   
        const myDiv = document.querySelector(`.markdown-columns-resizable[id="${blockId}"] > .column[data-index="${index}"]`);
	    if (myDiv instanceof HTMLElement) {
	    	myDiv.style.setProperty('--sc-column-bg', bgColor);
	    }
    }   
}

function applyColumnTextColorStyles(blockId: string, textColors: Record<number, string>) {
	for (const [index, color] of Object.entries(textColors)) {
        if (!color) continue; // Skip if no text color is set
		const myDiv = document.querySelector(`.markdown-columns-resizable[id="${blockId}"] > .column[data-index="${index}"]`);
		if (myDiv instanceof HTMLElement) {
			myDiv.style.setProperty('--sc-column-text-color', color);
		}
	}
}

function applyBorderStyles(blockId: string, borderColorRGB: string, showBorder: boolean) {
    const block = document.querySelector(`.markdown-columns-resizable[id="${blockId}"]`);
    if (block instanceof HTMLElement) {
		block.style.setProperty("--sc-border-shown", showBorder ? "solid" : "none");
		block.style.setProperty("--sc-border-color", borderColorRGB);
    }
}

function applyResizerStyles(blockId: string, resizerColorRGB: string, showResizer: boolean) {
    const block = document.querySelector(`.markdown-columns-resizable[id="${blockId}"]`);
    if (block instanceof HTMLElement) {
        const resizers = block.querySelectorAll(".column-resizer");
        resizers.forEach(resizer => {
            if (resizer instanceof HTMLElement) {
				resizer.classList.toggle("resizer-visible", showResizer);
				resizer.style.setProperty("--sc-resizer-bg", showResizer ? resizerColorRGB : "transparent");
			}
        });
		let css = `.markdown-columns-resizable[id="${blockId}"] > .column-resizer:hover{ background-color: ${resizerColorRGB} !important; }`;
		let hoverStyle = document.createElement('style');
		document.head.appendChild(hoverStyle);
		hoverStyle.textContent = css;	
    }
}


export class CustomiseColumnsModal extends Modal {
	plugin: ColumnsPlugin;   
	blockId: string;
	numberOfColumns: number;
	resizerColorRGB: string;	
	borderColorRGB: string;
	columnAlignments: Record<number, "left" | "center" | "right">;
    columnBackgrounds: Record<number, string> = {}; 
    columnTextColors: Record<number, string> = {}; 
	showBorder: boolean;
	showResizer: boolean;

	constructor(app: App, plugin: ColumnsPlugin, blockId: string, numberOfColumns: number, columnAlignments: Record<number, "left" | "center" | "right"> = {}, columnBackgrounds: Record<number, string> = {}, columnTextColors: Record<number, string> = {}) {   
		super(app);
		this.plugin = plugin;
		this.blockId = blockId;
		this.numberOfColumns = numberOfColumns;
		this.columnAlignments = columnAlignments;
        this.columnBackgrounds = columnBackgrounds;
        this.columnTextColors = columnTextColors;

		const borderData = JSON.parse(this.app.loadLocalStorage(`sc-borderColor-${this.blockId}`) || '{}');
		this.showBorder = borderData.show ?? this.plugin.settings.showBorders;
		this.borderColorRGB = borderData.color ?? convertToRGBA(this.plugin.settings.borderColor, this.plugin.settings.borderTransparency); 

		const resizerData = JSON.parse(this.app.loadLocalStorage(`sc-resizerColor-${this.blockId}`) || '{}');
		this.showResizer = resizerData.show ?? this.plugin.settings.showResizer;	
		this.resizerColorRGB = resizerData.color ?? convertToRGBA(this.plugin.settings.resizerColor, this.plugin.settings.resizerTransparency);
	}


	onOpen() {
  		const { contentEl } = this;
  		contentEl.createEl("h2", { text: "Customise columns" });
  		contentEl.createEl("p", { text: `Adjusting blockId: ${this.blockId}` });

		// Reset Button
		new Setting(contentEl)
		  .setName("Reset all styles")	
		  .addButton((button) =>
		    button
		      .setIcon("rotate-ccw")
		      .setButtonText("Confirm")
		      .setWarning() 
		      .onClick(() => {
		        // Reset border and divider colors to defaults
		        this.borderColorRGB = convertToRGBA(this.plugin.settings.borderColor, this.plugin.settings.borderTransparency);
		        this.resizerColorRGB = convertToRGBA(this.plugin.settings.resizerColor, this.plugin.settings.resizerTransparency);
				
		        // Clear style-specific localStorage values
		        const prefixes = [
				  'sc-borderColor',
				  'sc-resizerColor',
				  'sc-columnAlignments',
				  'sc-columnBackgrounds',
				  'sc-columnTextColors'
				];

				Object.keys(localStorage).forEach((key) => {
				  if (prefixes.some(prefix => key.includes(`-${prefix}-`)) && key.endsWith(`-${this.blockId}`)) {
				    localStorage.removeItem(key);
				  }
				});
			
		        // Reset in-memory state
		        this.columnAlignments = {};
		        this.columnBackgrounds = {};
		        this.columnTextColors = {};

				clearBlockStyles(this.blockId, this.numberOfColumns)
			
		        new Notice(`All custom styles have been reset for block ${this.blockId}!`);	
			
		        // Refresh modal
		        this.close(); 
		        this.open();  
		      })
		  );
		
		// Toggle show/hide border
    	new Setting(contentEl)
    	  .setName('Show border')
    	  .setDesc('Toggle to show or hide border.')
    	  .addToggle(toggle => toggle
    	    .setValue(this.showBorder)	
    	    .onChange(async (value) => {
    	    	this.showBorder = value;
    	    }));

		// Setting for Border Color
		new Setting(contentEl)
			.setName(`Border color`)
			.setDesc("Pick a border color and set its transparency.")
		  	.addColorPicker((picker) => {
		    	picker.setValue(rgbToHex(this.borderColorRGB));	
		    	picker.onChange((newHex) => {
				  const currentMatch = this.borderColorRGB.match(/rgb\((\d+), (\d+), (\d+), ([\d.]+)\)/);
				  const alphaPercent = currentMatch ? Math.round(parseFloat(currentMatch[4]) * 100) : 100;
				  const newRGBA = hexToRGBA(newHex, alphaPercent);
				  this.borderColorRGB = newRGBA;
				});
		  	})
		    .addText((text) => {
		    	const match = this.borderColorRGB.match(/rgb\((\d+), (\d+), (\d+), ([\d.]+)\)/);
		    	const alphaPercent = match ? Math.round(parseFloat(match[4]) * 100) : 100;
				
		    	text
		    	  .setPlaceholder("100")
		    	  .setValue(alphaPercent.toString())
		    	  .onChange((value) => {
		    	    const alpha = Math.max(0, Math.min(100, parseInt(value) || 100)) / 100;
		    	    const match = this.borderColorRGB.match(/rgb\((\d+), (\d+), (\d+), [\d.]+\)/);
		    	    if (match) {
		    	      const [r, g, b] = match.slice(1, 4);
		    	      this.borderColorRGB = `rgb(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
		    	    }
		    	  });
		  	});

		// Toggle show/hide resizer
    	new Setting(contentEl)
    	  .setName('Show resizer')
    	  .setDesc('Toggle to show or hide resizer. Resizer still shows on hover.')
    	  .addToggle(toggle => toggle
    	    .setValue(this.showResizer)
    	    .onChange(async (value) => {
    	    	this.showResizer = value;
    	    }));
		
		// Setting for Resizer Color	
		new Setting(contentEl)
			.setName(`Resizer color`)
			.setDesc("Pick a resizer color and set its transparency.")	
			.addColorPicker((picker) => {
			    picker.setValue(rgbToHex(this.resizerColorRGB));
			  	picker.onChange((newHex) => {
			  	  const currentMatch = this.resizerColorRGB.match(/rgb\((\d+), (\d+), (\d+), ([\d.]+)\)/);
			  	  const alphaPercent = currentMatch ? Math.round(parseFloat(currentMatch[4]) * 100) : 100;
			  	  const newRGBA = hexToRGBA(newHex, alphaPercent);
			  	  this.resizerColorRGB = newRGBA;
			  	});
			})
			.addText((text) => {
			  const match = this.resizerColorRGB.match(/rgb\((\d+), (\d+), (\d+), ([\d.]+)\)/);
			  const alphaPercent = match ? Math.round(parseFloat(match[4]) * 100) : 100;
			
			  text
			    .setPlaceholder("100")
			    .setValue(alphaPercent.toString())
			    .onChange((value) => {
			      const alpha = Math.max(0, Math.min(100, parseInt(value) || 100)) / 100;
			      const match = this.resizerColorRGB.match(/rgb\((\d+), (\d+), (\d+), [\d.]+\)/);
			      if (match) {
			        const [r, g, b] = match.slice(1, 4);
			        this.resizerColorRGB = `rgb(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
			      }
			    });
			});
									
		// Column Settings
  		for (let i = 1; i <= this.numberOfColumns; i++) {
	        // Ensure default alignment
	        if (!this.columnAlignments[i]) {
	        	this.columnAlignments[i] = "left";
	        }
        
	        const columnGroup = contentEl.createDiv({ cls: "column-settings-group" });
            columnGroup.createEl("h5", { text: `Column ${i}` });

            // Text Color Picker Setting
	        new Setting(columnGroup)
	        	.setName(`Text color`)
	        	.setDesc("Choose a text color for this column.")
	        	.addColorPicker((picker) => {
                    // Set initial value if present
                    if (this.columnTextColors[i]) {
                        picker.setValue(this.columnTextColors[i]);
                    }
					else {
						const textColor = getComputedStyle(document.body).getPropertyValue("--text-normal").trim();
						picker.setValue(textColor);	 
					}
                    picker.onChange((color) => {
                        this.columnTextColors[i] = color;
                    })
                });
        
	        // Background Color Picker Setting
            new Setting(columnGroup)
  				.setName("Background color")
  				.setDesc("Choose a background color and transparency for this column.")

				// Color picker:
  				.addColorPicker((picker) => {
  				  let initial = this.columnBackgrounds[i] || getComputedStyle(document.body).getPropertyValue("--background-primary").trim();
  				  picker.setValue(rgbToHex(initial));
  				  picker.onChange((hex) => {
  				    const currentMatch = initial.match(/rgb\((\d+), (\d+), (\d+), ([\d.]+)\)/);
				  	const alphaPercent = currentMatch ? Math.round(parseFloat(currentMatch[4]) * 100) : 100;
					const newRGBA = hexToRGBA(hex, alphaPercent);
  				    this.columnBackgrounds[i] = newRGBA;
  				  });
  				})
				// Transparency text input (0–100%)
  				.addText((text) => {
  				  let current = this.columnBackgrounds[i] || "var(--background-primary)";	
  				  const match = current.match(/rgb\((\d+), (\d+), (\d+), ([\d.]+)\)/);
			  	  const alphaPercent = match ? Math.round(parseFloat(match[4]) * 100) : 100;
  				  text
  				    .setPlaceholder("0 - 100")
  				    .setValue(alphaPercent.toString())	
  				    .onChange((val) => {
  				    	const alpha = Math.max(0, Math.min(100, parseInt(val) || 100)) / 100;
			      		const match = current.match(/rgb\((\d+), (\d+), (\d+), [\d.]+\)/);
			      		if (match) {
			        		const [r, g, b] = match.slice(1, 4);
			        		this.columnBackgrounds[i] = `rgb(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
			      		}
  				    });
  		});

  
	    // Text Alignment Setting
	    const textAlignSetting = new Setting(columnGroup)
	    	.setName(`Alignment`)
	    	.setDesc("Choose text alignment for this column.");
        
	    // Button group
	    const buttonGroup = textAlignSetting.controlEl.createDiv({ cls: "alignment-button-group" });
        
	    const alignments = [
	    	{ key: "left", icon: "align-left" },
	    	{ key: "center", icon: "align-center" },
	    	{ key: "right", icon: "align-right" },
	    ];
    
	    let selected = this.columnAlignments[i] ?? "left";
    
	    alignments.forEach(({ key, icon }) => {
	    	const btn = new ButtonComponent(buttonGroup);
	    	btn.setIcon(icon)
	    		.setTooltip(key.charAt(0).toUpperCase() + key.slice(1))
	    		.onClick(() => {
	    			selected = key as "left" | "center" | "right";
	    			this.columnAlignments[i] = selected;
                
	    			Array.from(buttonGroup.children).forEach(child => {
	    				child.toggleClass("active", child === btn.buttonEl);
	    			});
	    		});
            
	    	if (key === selected) {
	    		btn.buttonEl.classList.add("active");
	    	}
	    });
    }}


	onClose() {
		const { contentEl } = this;
		contentEl.empty();

		applyBorderStyles(this.blockId, this.borderColorRGB, this.showBorder);
		const outlineKey = `sc-borderColor-${this.blockId}`;
		this.app.saveLocalStorage(outlineKey, JSON.stringify({
			color: this.borderColorRGB,
			show: this.showBorder
		}));
		
		applyResizerStyles(this.blockId, this.resizerColorRGB, this.showResizer);
		const dividerKey = `sc-resizerColor-${this.blockId}`;
		this.app.saveLocalStorage(dividerKey, JSON.stringify({
			color: this.resizerColorRGB,
			show: this.showResizer
		}));

        applyColumnAlignmentStyles(this.blockId, this.columnAlignments);    
        const alignmentKey = `sc-columnAlignments-${this.blockId}`;
        const allLeft = Object.values(this.columnAlignments).every(value => value === "left");
		const keyToRemove = Object.keys(localStorage).find(key => 
		  key.endsWith(`-${alignmentKey}`)
		);

        if (allLeft && keyToRemove) {
          localStorage.removeItem(keyToRemove);
        } else {
            this.app.saveLocalStorage(alignmentKey, JSON.stringify(this.columnAlignments));
        }

        if (Object.keys(this.columnTextColors).length != 0) {
            applyColumnTextColorStyles(this.blockId, this.columnTextColors);
            const textColorKey = `sc-columnTextColors-${this.blockId}`;
            this.app.saveLocalStorage(textColorKey, JSON.stringify(this.columnTextColors));
        }
        
        if (Object.keys(this.columnBackgrounds).length != 0) {
            applyColumnBackgroundStyles(this.blockId, this.columnBackgrounds);
            const backgroundKey = `sc-columnBackgrounds-${this.blockId}`;
            this.app.saveLocalStorage(backgroundKey, JSON.stringify(this.columnBackgrounds));
        }
	}
}