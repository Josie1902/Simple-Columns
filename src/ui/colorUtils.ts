export function hexToRGBA(hex: string, alphaPercent: number): string {
  	if (!hex.startsWith('#') || hex.length !== 7) return hex;
  	const r = parseInt(hex.slice(1, 3), 16);
  	const g = parseInt(hex.slice(3, 5), 16);
  	const b = parseInt(hex.slice(5, 7), 16);
  	const a = Math.max(0, Math.min(100, alphaPercent)) / 100;
  	return `rgb(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

export function hslToRGBA(hsl: string, alphaPercent: number): string {
  const alpha = Math.max(0, Math.min(100, alphaPercent)) / 100;
  const hslMatch = hsl.match(/^hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)$/);

  if (!hsl.startsWith('hsl(') || !hslMatch) return hsl;
    const h = parseInt(hslMatch[1], 10);
    const s = parseInt(hslMatch[2], 10) / 100;
    const l = parseInt(hslMatch[3], 10) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) {
      r = c; g = x; b = 0;
    } else if (h < 120) {
      r = x; g = c; b = 0;
    } else if (h < 180) {
      r = 0; g = c; b = x;
    } else if (h < 240) {
      r = 0; g = x; b = c;
    } else if (h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    const r255 = Math.round((r + m) * 255);
    const g255 = Math.round((g + m) * 255);
    const b255 = Math.round((b + m) * 255);
    return `rgb(${r255}, ${g255}, ${b255}, ${alpha.toFixed(2)})`;
}

export function convertToRGBA(color: string, alphaPercent: number): string {
  	if (color.startsWith('#')) {
		return hexToRGBA(color, alphaPercent);
  	} else if (color.startsWith('hsl(')) {
		return hslToRGBA(color, alphaPercent);
  	} else if (color.startsWith('rgb(')) {
		const rgbaMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
		if (rgbaMatch) {
	  		const r = parseInt(rgbaMatch[1], 10);
	  		const g = parseInt(rgbaMatch[2], 10);
	  		const b = parseInt(rgbaMatch[3], 10);
	  		const a = Math.max(0, Math.min(1, parseFloat(rgbaMatch[4]))) * (alphaPercent / 100);
	  		return `rgb(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
		}
  	}
  	return color; // Return original if no match
}

export function rgbToHex(rgb: string): string {
	const result = rgb.match(/\d+/g);
	if (!result || result.length < 3) return rgb; // fallback

	const [r, g, b] = result.map(Number);
	return (
		"#" +
		[r, g, b]
			.map((x) => {
				const hex = x.toString(16);
				return hex.length === 1 ? "0" + hex : hex;
			})
			.join("")
	);
}
