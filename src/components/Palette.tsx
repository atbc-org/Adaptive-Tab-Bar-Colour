import clsx from "clsx";
import { type CSSProperties } from "react";
import styles from "./Palette.module.css";

interface PaletteProps {
	value?: string;
	inPopup?: boolean;
	onChange: (newValue: string) => void;
}

interface Location {
	orientation: "north" | "south";
	deviation: "none" | "left" | "right";
}

export default function Palette({
	value = "#000000",
	inPopup = false,
	onChange,
}: PaletteProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const previewRef = useRef<HTMLDivElement | null>(null);
	const textInputRef = useRef<HTMLInputElement | null>(null);
	const colourInputRef = useRef<HTMLInputElement | null>(null);

	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState(value);
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [popupValue, setPopupValue] = useState(value);
	const [popupLocation, setPopupLocation] = useState<Location>({
		orientation: "south",
		deviation: "none",
	});

	const displayValue = isPopupOpen ? popupValue : value;
	const displayColour = useMemo(
		() => new Colour(displayValue),
		[displayValue],
	);

	useEffect(() => {
		if (!isPopupOpen) setPopupValue(value);
	}, [isPopupOpen, value]);

	useEffect(() => {
		const onPointerDown = (event: PointerEvent) => {
			if (
				!containerRef.current?.contains(event.target as Node) ||
				textInputRef.current?.contains(event.target as Node)
			)
				setIsPopupOpen(false);
		};
		if (isPopupOpen) {
			document.addEventListener("pointerdown", onPointerDown);
			return () =>
				document.removeEventListener("pointerdown", onPointerDown);
		}
	}, [isPopupOpen]);

	useEffect(() => {
		const onBlur = () => setIsPopupOpen(false);
		document.addEventListener("blur", onBlur);
		return () => document.removeEventListener("blur", onBlur);
	}, []);

	return (
		<div className={styles.palette} ref={containerRef}>
			<input
				type="text"
				ref={textInputRef}
				placeholder={i18n.t("anyCSSColour")}
				title={i18n.t("anyCSSColour")}
				value={isEditing ? text : displayValue}
				onFocus={(e) => {
					setIsEditing(true);
					setText(displayValue);
					e.target.select();
				}}
				onBlur={(e) => {
					setIsEditing(false);
					e.target.scrollLeft = 0;
				}}
				onChange={(e) => {
					const value = e.target.value;
					const hex = new Colour(value).toHex();
					setText(value);
					setPopupValue(hex);
					onChange(hex);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") e.currentTarget.blur();
				}}
			/>
			<div
				ref={previewRef}
				className={styles.preview}
				style={{ backgroundColor: displayValue }}
				onClick={() => {
					if (!isPopupOpen) {
						const preview = previewRef.current;
						if (!preview)
							return setPopupLocation({
								orientation: "south",
								deviation: "none",
							});
						const rect = preview.getBoundingClientRect();
						const width = 96;
						const height = 256;
						const top = rect.top;
						const bottom = window.innerHeight - rect.bottom;
						const left = rect.left;
						const right = window.innerWidth - rect.right;
						const orientation =
							bottom >= height || top < height
								? "south"
								: "north";
						const deviation =
							left >= width && right >= width
								? "none"
								: left < width
									? "right"
									: "left";
						setPopupLocation({ orientation, deviation });
					}
					setIsPopupOpen(!isPopupOpen);
				}}
			/>
			{!inPopup && (
				<input
					ref={colourInputRef}
					type="color"
					value={displayValue}
					onChange={(e) => {
						const value = e.target.value;
						const hex = new Colour(value).toHex();
						setText(value);
						setPopupValue(hex);
						onChange(hex);
					}}
				/>
			)}
			{isPopupOpen && (
				<PalettePopup
					value={displayColour}
					inPopup={inPopup}
					location={popupLocation}
					openColourInput={() => {
						setIsPopupOpen(false);
						colourInputRef.current?.click();
					}}
					onChange={(hex) => {
						setText(hex);
						setPopupValue(hex);
						onChange(hex);
					}}
				/>
			)}
		</div>
	);
}

interface PalettePopupProps {
	value: Colour;
	inPopup: boolean;
	location: Location;
	openColourInput: () => void;
	onChange: (hex: string) => void;
}

type ColourFormat = "HEX" | "RGB" | "HWB" | "CSS";

function PalettePopup({
	value,
	inPopup,
	location,
	openColourInput,
	onChange,
}: PalettePopupProps) {
	const wbPlaneRef = useRef<HTMLDivElement | null>(null);
	const hSliderRef = useRef<HTMLDivElement | null>(null);
	const lastXRef = useRef(0);
	const [hwb, setHwb] = useState(() => value.toHWB());
	const [format, setFormat] = useState<ColourFormat>("HEX");

	useEffect(() => {
		setHwb((lastHwb) => {
			const previousHex = new Colour()
				.hwb(lastHwb.h, lastHwb.w, lastHwb.b)
				.toHex();
			if (value.toHex() === previousHex) return lastHwb;
			const nextHwb = value.toHWB();
			if (nextHwb.w + nextHwb.b >= 100) {
				return { h: lastHwb.h, w: nextHwb.w, b: nextHwb.b };
			}
			return nextHwb;
		});
	}, [value]);

	useEffect(() => {
		if (hwb.b !== 100) lastXRef.current = 1 - hwb.w / (100 - hwb.b);
	}, [hwb]);

	const onMoveStop = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		if (e.currentTarget.hasPointerCapture(e.pointerId))
			e.currentTarget.releasePointerCapture(e.pointerId);
	}, []);

	const onWBMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
			if (!wbPlaneRef.current) return;
			if (e.buttons === 0) return onMoveStop(e);
			const rect = wbPlaneRef.current.getBoundingClientRect();
			const x = clamp(0, (e.clientX - rect.left) / rect.width, 1);
			const y = clamp(0, (e.clientY - rect.top) / rect.height, 1);
			lastXRef.current = x;
			const w = 100 * (1 - x) * (1 - y);
			const b = 100 * y;
			setHwb({ h: hwb.h, w, b });
			onChange(new Colour().hwb(hwb.h, w, b).toHex());
		},
		[hwb.h, onChange, onMoveStop],
	);

	const onHMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
			if (!hSliderRef.current) return;
			if (e.buttons === 0) return onMoveStop(e);
			const rect = hSliderRef.current.getBoundingClientRect();
			const h = 360 * clamp(0, (e.clientX - rect.left) / rect.width, 1);
			setHwb({ h, w: hwb.w, b: hwb.b });
			onChange(new Colour().hwb(h, hwb.w, hwb.b).toHex());
		},
		[hwb.w, hwb.b, onChange, onMoveStop],
	);

	return (
		<div
			className={clsx(
				styles.popup,
				inPopup && styles.inPopup,
				location.orientation === "north" && styles.popupNorth,
				location.orientation === "south" && styles.popupSouth,
				location.deviation === "left" && styles.popupLeft,
				location.deviation === "right" && styles.popupRight,
			)}
		>
			<div
				className={styles.wbPlane}
				ref={wbPlaneRef}
				onPointerDown={(e) => {
					e.currentTarget.setPointerCapture(e.pointerId);
					onWBMove(e);
				}}
				onPointerMove={onWBMove}
				onPointerUp={onMoveStop}
				onPointerCancel={onMoveStop}
				style={
					{
						backgroundColor: `hwb(${hwb.h} 0% 0%)`,
						"--x": `${hwb.b === 100 ? lastXRef.current * 100 : (1 - hwb.w / (100 - hwb.b)) * 100}%`,
						"--y": `${hwb.b}%`,
					} as CSSProperties
				}
			>
				<div className={styles.wbIris} />
				<div
					className={styles.wbPupil}
					style={{
						backgroundColor: `hwb(${hwb.h} ${hwb.w}% ${hwb.b}%)`,
					}}
				/>
			</div>
			<div
				className={styles.hSlider}
				ref={hSliderRef}
				onPointerDown={(e) => {
					e.currentTarget.setPointerCapture(e.pointerId);
					onHMove(e);
				}}
				onPointerMove={onHMove}
				onPointerUp={onMoveStop}
				onPointerCancel={onMoveStop}
				style={{ "--x": `${(hwb.h / 360) * 100}%` } as CSSProperties}
			>
				<div className={styles.hIris} />
				<div
					className={styles.hPupil}
					style={{ backgroundColor: `hwb(${hwb.h} 0% 0%)` }}
				/>
			</div>
			<div className={styles.toolbox}>
				<select
					value={format}
					onChange={(e) => {
						const value = e.target.value;
						if (value === "SYS") openColourInput();
						else setFormat(value as ColourFormat);
					}}
				>
					<option value="HEX">HEX</option>
					<option value="RGB">RGB</option>
					<option value="HWB">HWB</option>
					<option value="CSS">CSS</option>
					{!inPopup && (
						<option value="SYS">{i18n.t("system")}</option>
					)}
				</select>
				{(() => {
					switch (format) {
						case "HEX":
							return (
								<HEXInput
									hex={value.toHex().slice(1)}
									onChange={(css) =>
										onChange(new Colour(css).toHex())
									}
								/>
							);
						case "RGB":
							return (
								<RGBInput
									rgb={value}
									onChange={(rgb) => {
										onChange(
											new Colour()
												.rgb(rgb.r, rgb.g, rgb.b)
												.toHex(),
										);
									}}
								/>
							);
						case "HWB":
							return (
								<HWBInput
									hwb={hwb}
									onChange={(hwb) => {
										setHwb(hwb);
										onChange(
											new Colour()
												.hwb(hwb.h, hwb.w, hwb.b)
												.toHex(),
										);
									}}
								/>
							);
						case "CSS":
							return (
								<CSSInput
									css={value.toHex()}
									onChange={(css) =>
										onChange(new Colour(css).toHex())
									}
								/>
							);
					}
				})()}
			</div>
		</div>
	);
}

function HEXInput({
	hex,
	onChange,
}: {
	hex: string;
	onChange: (hex: string) => void;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState(hex);

	return (
		<div className={styles.hex}>
			<input
				type="text"
				value={isEditing ? text : hex}
				onFocus={(e) => {
					setIsEditing(true);
					setText(hex);
					e.target.select();
				}}
				onBlur={() => setIsEditing(false)}
				onChange={(e) => {
					const value = e.target.value;
					if (value !== "" && !/^[0-9A-Fa-f]*$/.test(value)) return;
					setText(value.toLowerCase());
					if (value.length === 3 || value.length === 6)
						onChange(`#${value}`);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") e.currentTarget.blur();
				}}
			/>
		</div>
	);
}

function RGBInput({
	rgb,
	onChange,
}: {
	rgb: { r: number; g: number; b: number };
	onChange: (rgb: { r: number; g: number; b: number }) => void;
}) {
	const r = Math.round(rgb.r).toString();
	const g = Math.round(rgb.g).toString();
	const b = Math.round(rgb.b).toString();
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState({ r, g, b });

	const getNum = (value: string, fallback: string) =>
		parseFloat(value || fallback || "0");

	const onNumberChange = (
		key: "r" | "g" | "b",
		value: string,
		onValid: (num: number) => void,
	) => {
		if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
		setText((prev) => ({ ...prev, [key]: value }));
		onValid(parseFloat(value || "0"));
	};

	const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		if (!isEditing) {
			setIsEditing(true);
			setText({ r, g, b });
		}
		e.target.select();
	};

	return (
		<>
			<div>
				<input
					type="text"
					value={isEditing ? text.r : r}
					onFocus={onFocus}
					onBlur={() => setIsEditing(false)}
					onChange={(e) =>
						onNumberChange("r", e.target.value, (nr) => {
							onChange({
								r: nr,
								g: getNum(text.g, g),
								b: getNum(text.b, b),
							});
						})
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</div>
			<div>
				<input
					type="text"
					value={isEditing ? text.g : g}
					onFocus={onFocus}
					onBlur={() => setIsEditing(false)}
					onChange={(e) =>
						onNumberChange("g", e.target.value, (ng) => {
							onChange({
								r: getNum(text.r, r),
								g: ng,
								b: getNum(text.b, b),
							});
						})
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</div>
			<div>
				<input
					type="text"
					value={isEditing ? text.b : b}
					onFocus={onFocus}
					onBlur={() => setIsEditing(false)}
					onChange={(e) =>
						onNumberChange("b", e.target.value, (nb) => {
							onChange({
								r: getNum(text.r, r),
								g: getNum(text.g, g),
								b: nb,
							});
						})
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</div>
		</>
	);
}

function HWBInput({
	hwb,
	onChange,
}: {
	hwb: { h: number; w: number; b: number };
	onChange: (hwb: { h: number; w: number; b: number }) => void;
}) {
	const h = Math.round(hwb.h).toString();
	const w = Math.round(hwb.w).toString();
	const b = Math.round(hwb.b).toString();
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState({ h, w, b });

	const getNum = (value: string, fallback: string) =>
		parseFloat(value || fallback || "0");

	const onNumberChange = (
		key: "h" | "w" | "b",
		value: string,
		onValid: (num: number) => void,
	) => {
		if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
		setText((prev) => ({ ...prev, [key]: value }));
		onValid(parseFloat(value || "0"));
	};

	const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		if (!isEditing) {
			setIsEditing(true);
			setText({ h, w, b });
		}
		e.target.select();
	};

	return (
		<>
			<div>
				<input
					type="text"
					value={isEditing ? text.h : h}
					onFocus={onFocus}
					onBlur={() => setIsEditing(false)}
					onChange={(e) =>
						onNumberChange("h", e.target.value, (nh) => {
							onChange({
								h: nh,
								w: getNum(text.w, w),
								b: getNum(text.b, b),
							});
						})
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</div>
			<div className={styles.percent}>
				<input
					type="text"
					value={isEditing ? text.w : w}
					onFocus={onFocus}
					onBlur={() => setIsEditing(false)}
					onChange={(e) =>
						onNumberChange("w", e.target.value, (nw) => {
							onChange({
								h: getNum(text.h, h),
								w: nw,
								b: getNum(text.b, b),
							});
						})
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</div>
			<div className={styles.percent}>
				<input
					type="text"
					value={isEditing ? text.b : b}
					onFocus={onFocus}
					onBlur={() => setIsEditing(false)}
					onChange={(e) =>
						onNumberChange("b", e.target.value, (nb) => {
							onChange({
								h: getNum(text.h, h),
								w: getNum(text.w, w),
								b: nb,
							});
						})
					}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</div>
		</>
	);
}

function CSSInput({
	css,
	onChange,
}: {
	css: string;
	onChange: (css: string) => void;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState(css);

	return (
		<div className={styles.css}>
			<input
				type="text"
				value={isEditing ? text : css}
				onFocus={(e) => {
					setIsEditing(true);
					setText(css);
					e.target.select();
				}}
				onBlur={(e) => {
					setIsEditing(false);
					e.target.scrollLeft = 0;
				}}
				onChange={(e) => {
					const value = e.target.value;
					setText(value);
					onChange(value);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") e.currentTarget.blur();
				}}
			/>
		</div>
	);
}
