// This file is used to extend the Obsidian types with custom properties or methods.

declare module 'obsidian' {
	interface Menu {
		dom: HTMLElement;
		items: MenuItem[];
		onMouseOver: (evt: MouseEvent) => void;
	}

	interface MenuItem {
		callback: () => void;
		dom: HTMLElement;
		setSubmenu: () => Menu;
		disabled: boolean;
		setWarning: (warning: boolean) => void;
	}
}

export {};