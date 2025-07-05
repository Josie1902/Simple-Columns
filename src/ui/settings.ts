import { convertToRGBA } from "./colorUtils";
import ColumnsPlugin from "main";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";

export interface ColumnsPluginSettings {
  showBorders: boolean; //toggle to show or hide borders between columns
  borderWidth: number; // in pixels 
  borderColor: string; // supports RGB, HSL, and HEX color code
  borderTransparency: number; // 0-100 percentage for transparency
  showResizer: boolean; // toggle to show or hide resizer between columns
  resizerColor: string; // supports RGB. HSL, and HEX color code
  resizerWidth: number; // in pixels
  resizerTransparency: number; // 0-100 percentage for transparency
}

export const DEFAULT_SETTINGS: ColumnsPluginSettings = {
  showBorders: true,
  borderWidth: 1,
  borderColor: '#f0f0f0',
  borderTransparency: 100,
  showResizer: true,
  resizerColor: '#f0f0f0',
  resizerWidth: 3,
  resizerTransparency: 100,
};

export class ColumnWidthsSettingTab extends PluginSettingTab {
    plugin: ColumnsPlugin;   

    constructor(app: App, plugin: ColumnsPlugin) {
      super(app, plugin);
      this.plugin = plugin;
    }

	applyStyles() {
		const {
		  showBorders,
		  borderColor,
		  borderWidth,
		  borderTransparency,
		  showResizer,
		  resizerTransparency,
		  resizerColor,
		  resizerWidth,
		} = this.plugin.settings;
		
		const finalBorderColor = convertToRGBA(borderColor, borderTransparency ?? 100);
		const finalResizerColor = convertToRGBA(resizerColor, resizerTransparency ?? 100);
		document.documentElement.style.setProperty('--sc-border-width', `${borderWidth}px`);
  		document.documentElement.style.setProperty('--sc-border-shown', showBorders ? 'solid' : 'none'); 
  		document.documentElement.style.setProperty('--sc-border-color', showBorders ? finalBorderColor : 'transparent');

		document.documentElement.style.setProperty('--sc-resizer-bg', showResizer ? finalResizerColor : 'transparent');
		document.documentElement.style.setProperty('--sc-resizer-hover-bg', finalResizerColor);
		document.documentElement.style.setProperty('--sc-resizer-width', `${resizerWidth}px`);
	}		

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        
        const settings = this.plugin.settings;

        const borderGroup = containerEl.createDiv({ cls: 'column-border-settings' });
        borderGroup.createEl('h6', { text: 'Global border settings' });
    
    	// Toggle border on/off
    	new Setting(borderGroup)
    	  .setName('Show container borders')
    	  .setDesc('Toggle to show or hide the border of column container.')
    	  .addToggle(toggle => toggle
    	    .setValue(settings.showBorders)
    	    .onChange(async (value) => {
    	      settings.showBorders = value;
    	      await this.plugin.saveSettings();
			  this.applyStyles();
			  this.display(); // Refresh settings display
    	    }));
        
    	// Only show border settings if borders are enabled 
    	if (settings.showBorders) {
            // Border width
    	  	new Setting(borderGroup)
    	  	  .setName('Width (px)')
              .setDesc('Set width of the column border')
    	  	  .addText(text => text
    	  	    .setPlaceholder('1')
				.setValue(settings.borderWidth.toString())
    	  	    .onChange(async (value) => {
    	  	      settings.borderWidth = parseInt(value) || DEFAULT_SETTINGS.borderWidth;
    	  	      await this.plugin.saveSettings();
				  this.applyStyles();
    	  	    }));
            
            // Border color and transparency
    	  	new Setting(borderGroup)
    	  	    .setName('Color and transparency (%)')
                .setDesc('Set color and transparency of the border')
    		    .addColorPicker((picker) => {
      		        picker
      		          .setValue(this.plugin.settings.borderColor)
      		          .onChange(async (value) => {
      		            this.plugin.settings.borderColor = value;
      		            await this.plugin.saveSettings();
      		            this.applyStyles();
      		        	});
    		        })
                .addText((text) => {
    			  text
    			    .setPlaceholder('100') // fully opaque
    			    .setValue(this.plugin.settings.borderTransparency.toString() ?? '100')
    			    .onChange(async (value) => {
    			      const alpha = Math.min(100, Math.max(0, parseInt(value) || 0));
    			      this.plugin.settings.borderTransparency = alpha;
    			      await this.plugin.saveSettings();
					  this.applyStyles();
    			    });
    			});
    	}

        const resizerGroup = containerEl.createDiv({ cls: 'column-resizer-settings' });
        resizerGroup.createEl('h6', { text: 'Global resizer settings' });  

		// Toggle show/hide resizer
    	new Setting(resizerGroup)
    	  .setName('Show resizer')
    	  .setDesc('Toggle to show or hide resizer. Resizer still shows on hover.')
    	  .addToggle(toggle => toggle
    	    .setValue(settings.showResizer)
    	    .onChange(async (value) => {
    	      settings.showResizer = value;
    	      await this.plugin.saveSettings();
			  this.applyStyles();
    	    }));

    	// Resizer width
    	new Setting(resizerGroup)
    	  .setName('Width (px)')
     	  .setDesc('Set width of the resizer between columns')
    	  .addText(text => text
    	    .setPlaceholder('3')
    	    .setValue(settings.resizerWidth.toString())
    	    .onChange(async (value) => {
    	      settings.resizerWidth = parseInt(value) || DEFAULT_SETTINGS.resizerWidth;
    	      await this.plugin.saveSettings();
			  this.applyStyles();
    	    }));
        
    	// Resizer color and transparency
    	new Setting(resizerGroup)
    		.setName("Color and transparency (%)")  
            .setDesc("Set color and transparency of the resizer between columns.")   
    		.addColorPicker((picker) => {
      		    picker
      		      .setValue(this.plugin.settings.resizerColor)
      		      .onChange(async (value) => {
      		    	this.plugin.settings.resizerColor = value;
      		    	await this.plugin.saveSettings();
      		        this.applyStyles();
      		    	});
    		    })
            .addText((text) => {
    			text
    			    .setPlaceholder('100') // fully opaque
    			    .setValue(this.plugin.settings.resizerTransparency.toString() ?? '100')
    			    .onChange(async (value) => {
    			      const alpha = Math.min(100, Math.max(0, parseInt(value) || 0));
    			      this.plugin.settings.resizerTransparency = alpha;
    			      await this.plugin.saveSettings();
      		          this.applyStyles();
    			    });
    			});
        
        const advancedGroup = containerEl.createDiv({ cls: 'column-advanced-settings' });
        advancedGroup.createEl('h6', { text: 'Advanced settings' });

        new Setting(advancedGroup)
            .setName('Reset to default')
            .setDesc('Reset all settings to default values.')
            .addButton(button => button
                .setIcon('rotate-ccw')
                .setButtonText('Reset')
                .setWarning()
                .onClick(async () => {
                    this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
                    await this.plugin.saveSettings();
                    this.applyStyles();
                    this.display();
                    new Notice('Settings reset to default values.');
                }));    
		
		new Setting(advancedGroup)
            .setName('Clear local storage')
			.setDesc('Clear all local storage data related to columns plugin.')
            .addButton(button => button
                .setIcon('trash')
                .setButtonText('Clear')
                .setWarning()
                .onClick(async () => {
					// Clear all local storage keys that contains 'sc-' --> custom simple columns styles
                    for (let key in localStorage) {
					  if (key.startsWith('sc-')) {
					    localStorage.removeItem(key);
					  }
					}
                    new Notice('Local storage cleared for columns plugin.');
                }));    
    }
}   
    