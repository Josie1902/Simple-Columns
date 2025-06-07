export function createCustomiseButton(container: HTMLElement): HTMLElement {
	const customiseButton = container.createDiv({
		cls: "customise-columns-button",
		attr: {
			"aria-label": "Customise this block",
		},
	});

	const settingsIcon = customiseButton.createSvg("svg", "svg-icon", (svg) => {
		svg.setAttr("xmlns", "http://www.w3.org/2000/svg");
		svg.setAttr("width", "24");
		svg.setAttr("height", "24");
		svg.setAttr("viewBox", "0 0 24 24");
		svg.setAttr("fill", "none");
		svg.setAttr("stroke", "currentColor");
		svg.setAttr("stroke-width", "2");
		svg.setAttr("stroke-linecap", "round");
		svg.setAttr("stroke-linejoin", "round");
	});

	settingsIcon.createSvg("path", "", (path) => {
		path.setAttr("d", "M20 7h-9");
	});
	settingsIcon.createSvg("path", "", (path) => {
		path.setAttr("d", "M14 17H5");
	});
	settingsIcon.createSvg("circle", "", (circle) => {
		circle.setAttr("cx", "17");
		circle.setAttr("cy", "17");
		circle.setAttr("r", "3");
	});
	settingsIcon.createSvg("circle", "", (circle) => {
		circle.setAttr("cx", "7");
		circle.setAttr("cy", "7");
		circle.setAttr("r", "3");
	});

	return customiseButton;
}
