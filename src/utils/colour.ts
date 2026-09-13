/**
 * Represents a colour with RGBA channels.
 *
 * Provides methods for parsing, manipulating, and converting colours, as well
 * as calculating contrast and luminance for accessibility.
 *
 * @class
 */
export class Colour {
	#r = 0;
	#g = 0;
	#b = 0;
	#a = 0;

	/** Parses the initialiser to set the colour. */
	constructor(initialiser: string | Colour | undefined = undefined) {
		this.parse(initialiser);
	}

	/** Parses the value to set the colour. */
	parse(value: string | Colour | undefined = undefined): this {
		if (typeof value === "string") {
			const canvas = new OffscreenCanvas(1, 1);
			const canvasContext = canvas.getContext("2d");
			if (!canvasContext) return this;
			canvasContext.fillStyle = value;
			const parsedColour = canvasContext.fillStyle;
			if (parsedColour.startsWith("#")) {
				return this.rgba(
					parseInt(parsedColour.slice(1, 3), 16),
					parseInt(parsedColour.slice(3, 5), 16),
					parseInt(parsedColour.slice(5, 7), 16),
					1,
				);
			} else {
				const rgbaValues =
					parsedColour.match(/[.?\d]+/g)?.map(Number) ?? [];
				return this.rgba(
					rgbaValues[0] ?? 0,
					rgbaValues[1] ?? 0,
					rgbaValues[2] ?? 0,
					rgbaValues[3] ?? 1,
				);
			}
		} else if (value instanceof Colour) {
			return this.rgba(value.r, value.g, value.b, value.a);
		} else {
			return this;
		}
	}

	/** Assigns RGBA values. */
	rgba(r: number, g: number, b: number, a: number): this {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
		return this;
	}

	/** Assigns RGB values. */
	rgb(r: number, g: number, b: number): this {
		this.r = r;
		this.g = g;
		this.b = b;
		return this;
	}

	/** Assigns HWB values. */
	hwb(h: number, w: number, b: number): this {
		const hw = w / 100;
		const hb = b / 100;
		if (hw + hb >= 1) {
			const gray = Math.round((hw / (hw + hb)) * 255);
			this.r = gray;
			this.g = gray;
			this.b = gray;
			return this;
		}
		const v = 1 - hb;
		const s = 1 - hw / v;
		let c = v * s,
			x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
			m = v - c,
			cr = 0,
			cg = 0,
			cb = 0;
		if (0 <= h && h < 60) {
			cr = c;
			cg = x;
			cb = 0;
		} else if (60 <= h && h < 120) {
			cr = x;
			cg = c;
			cb = 0;
		} else if (120 <= h && h < 180) {
			cr = 0;
			cg = c;
			cb = x;
		} else if (180 <= h && h < 240) {
			cr = 0;
			cg = x;
			cb = c;
		} else if (240 <= h && h < 300) {
			cr = x;
			cg = 0;
			cb = c;
		} else if (300 <= h && h < 360) {
			cr = c;
			cg = 0;
			cb = x;
		} else {
			return this.hwb(h % 360, w, b);
		}
		this.r = Math.round((cr + m) * 255);
		this.g = Math.round((cg + m) * 255);
		this.b = Math.round((cb + m) * 255);
		return this;
	}

	/** Applies an opacity factor to the current colour. */
	opacity(opacity: number): this {
		this.#a *= Math.max(0, Math.min(1, opacity));
		return this;
	}

	/** Randomises the colour. */
	random(): this {
		this.r = Math.floor(Math.random() * 256);
		this.g = Math.floor(Math.random() * 256);
		this.b = Math.floor(Math.random() * 256);
		this.a = 1;
		return this;
	}

	/**
	 * Returns a new colour instance with its brightness adjusted by the
	 * specified percentage.
	 *
	 * - 0 returns the original colour.
	 * - Positive values move the colour towards white (100 is white).
	 * - Negative values move the colour towards black (-100 is black).
	 * - Values beyond the range of -100 to 100 make the colour black or white.
	 */
	brightness(percentage: number): Colour {
		const cent = percentage / 100;
		if (1 < cent) {
			return new Colour().rgba(255, 255, 255, this.#a);
		} else if (0 < cent && cent <= 1) {
			return new Colour().rgba(
				cent * 255 + (1 - cent) * this.#r,
				cent * 255 + (1 - cent) * this.#g,
				cent * 255 + (1 - cent) * this.#b,
				this.#a,
			);
		} else if (cent === 0) {
			return new Colour(this);
		} else if (-1 <= cent && cent < 0) {
			return new Colour().rgba(
				(cent + 1) * this.#r,
				(cent + 1) * this.#g,
				(cent + 1) * this.#b,
				this.#a,
			);
		} else if (cent < -1) {
			return new Colour().rgba(0, 0, 0, this.#a);
		} else {
			return new Colour(this);
		}
	}

	/** Mixes this colour with another underneath. */
	mix(colourValue: Colour): Colour {
		const a = this.#a + colourValue.a * (1 - this.#a);
		return a === 0
			? new Colour()
			: new Colour().rgba(
					(this.#a * this.#r +
						colourValue.a * (1 - this.#a) * colourValue.r) /
						a,
					(this.#a * this.#g +
						colourValue.a * (1 - this.#a) * colourValue.g) /
						a,
					(this.#a * this.#b +
						colourValue.a * (1 - this.#a) * colourValue.b) /
						a,
					a,
				);
	}

	/** Adjusts colour to meet minimum contrast. */
	contrastCorrection(
		preferredScheme: Scheme,
		allowDarkLight: boolean,
		minContrastLightX10: number,
		minContrastDarkX10: number,
		contrastColourLight: Colour = new Colour().rgba(0, 0, 0, 1),
		contrastColourDark: Colour = new Colour().rgba(255, 255, 255, 1),
	): ColourCorrectionResult {
		const contrastRatioLight = this.#contrastRatio(contrastColourLight);
		const contrastRatioDark = this.#contrastRatio(contrastColourDark);
		const eligibilityLight = contrastRatioLight > minContrastLightX10 / 10;
		const eligibilityDark = contrastRatioDark > minContrastDarkX10 / 10;
		if (
			eligibilityLight &&
			(preferredScheme === "light" ||
				(preferredScheme === "dark" && allowDarkLight))
		) {
			return { colour: this, scheme: "light", corrected: false };
		} else if (
			eligibilityDark &&
			(preferredScheme === "dark" ||
				(preferredScheme === "light" && allowDarkLight))
		) {
			return { colour: this, scheme: "dark", corrected: false };
		} else if (preferredScheme === "light") {
			const dim =
				(100 *
					((minContrastLightX10 / (10 * contrastRatioLight) - 1) *
						(this.#luminanceX255() + 12.75))) /
				(255 - this.#luminanceX255());
			return {
				colour: this.brightness(dim),
				scheme: "light",
				corrected: true,
			};
		} else if (preferredScheme === "dark") {
			const dim =
				(100 * (10 * contrastRatioDark)) / minContrastDarkX10 - 100;
			return {
				colour: this.brightness(dim),
				scheme: "dark",
				corrected: true,
			};
		} else {
			throw new Error("Cannot process colour correction");
		}
	}

	/**
	 * Calculates the contrast ratio between this colour and another colour.
	 *
	 * Contrast ratio over 4.5 is considered adequate for accessibility.
	 *
	 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
	 */
	#contrastRatio(colourValue: Colour): number {
		const luminance1X255 = this.#luminanceX255();
		const luminance2X255 = colourValue.#luminanceX255();
		return luminance1X255 > luminance2X255
			? (luminance1X255 + 12.75) / (luminance2X255 + 12.75)
			: (luminance2X255 + 12.75) / (luminance1X255 + 12.75);
	}

	/**
	 * Calculates the relative luminance of the colour (times 255).
	 *
	 * @see https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
	 */
	#luminanceX255(): number {
		return (
			0.2126 * this.#channelLuminance(this.#r) +
			0.7152 * this.#channelLuminance(this.#g) +
			0.0722 * this.#channelLuminance(this.#b)
		);
	}

	/** Converts an sRGB channel value to channel luminance (times 255). */
	#channelLuminance(value: number): number {
		if (value < 0) {
			return 0;
		} else if (value < 32) {
			return 0.1151 * value;
		} else if (value < 64) {
			return 0.2935 * value - 5.7074;
		} else if (value < 96) {
			return 0.5236 * value - 20.4339;
		} else if (value < 128) {
			return 0.788 * value - 45.8232;
		} else if (value < 160) {
			return 1.0811 * value - 83.3411;
		} else if (value < 192) {
			return 1.3992 * value - 134.2269;
		} else if (value < 224) {
			return 1.7395 * value - 199.5679;
		} else if (value < 256) {
			return 2.1001 * value - 280.341;
		} else {
			return 255;
		}
	}

	/** Returns the colour as an RGB CSS string. */
	toRGB(): string {
		return `rgb(${this.#r}, ${this.#g}, ${this.#b})`;
	}

	/** Returns the colour as an RGBA CSS string. */
	toRGBA(): string {
		return `rgba(${this.#r}, ${this.#g}, ${this.#b}, ${this.#a})`;
	}

	/** Returns the colour as a hex string. */
	toHex(): string {
		const hexR = Math.round(this.#r).toString(16).padStart(2, "0");
		const hexG = Math.round(this.#g).toString(16).padStart(2, "0");
		const hexB = Math.round(this.#b).toString(16).padStart(2, "0");
		return `#${hexR}${hexG}${hexB}`;
	}

	/** Returns the colour as a hex string with alpha. */
	toHexa(): string {
		const hexR = Math.round(this.#r).toString(16).padStart(2, "0");
		const hexG = Math.round(this.#g).toString(16).padStart(2, "0");
		const hexB = Math.round(this.#b).toString(16).padStart(2, "0");
		const hexA = Math.round(255 * this.#a)
			.toString(16)
			.padStart(2, "0");
		return `#${hexR}${hexG}${hexB}${hexA}`;
	}

	/** Returns the colour as HWB channel values. */
	toHWB(): { h: number; w: number; b: number } {
		const cr = this.#r / 255;
		const cg = this.#g / 255;
		const cb = this.#b / 255;
		const cmin = Math.min(cr, cg, cb),
			cmax = Math.max(cr, cg, cb),
			delta = cmax - cmin;
		let h = 0;
		if (delta === 0) h = 0;
		else if (cmax === cr) h = ((cg - cb) / delta) % 6;
		else if (cmax === cg) h = (cb - cr) / delta + 2;
		else h = (cr - cg) / delta + 4;
		h = Math.round(h * 60);
		if (h < 0) h += 360;
		const w = cmin * 100;
		const b = (1 - cmax) * 100;
		return { h, w, b };
	}

	/** Checks if the colour is fully opaque. */
	isOpaque(): boolean {
		return this.#a === 1;
	}

	/** Gets the red channel value. */
	get r(): number {
		return this.#r;
	}

	/** Sets the red channel value. */
	set r(value: number) {
		const num = Number(value);
		if (isNaN(num)) throw new Error("Invalid value for r");
		this.#r = Math.max(0, Math.min(255, num));
	}

	/** Gets the green channel value. */
	get g(): number {
		return this.#g;
	}

	/** Sets the green channel value. */
	set g(value: number) {
		const num = Number(value);
		if (isNaN(num)) throw new Error("Invalid value for g");
		this.#g = Math.max(0, Math.min(255, num));
	}

	/** Gets the blue channel value. */
	get b(): number {
		return this.#b;
	}

	/** Sets the blue channel value. */
	set b(value: number) {
		const num = Number(value);
		if (isNaN(num)) throw new Error("Invalid value for b");
		this.#b = Math.max(0, Math.min(255, num));
	}

	/** Gets the alpha channel value. */
	get a(): number {
		return this.#a;
	}

	/** Sets the alpha channel value. */
	set a(value: number) {
		const num = Number(value);
		if (isNaN(num)) throw new Error("Invalid value for a");
		this.#a = Math.max(0, Math.min(1, num));
	}
}

export default Colour;
