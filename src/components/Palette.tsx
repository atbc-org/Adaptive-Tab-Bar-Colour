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

type ColourFormat = "HEX" | "RGB" | "HWB" | "CSS" | "PAGE";

function PalettePopup({
	value,
	inPopup,
	location,
	openColourInput,
	onChange,
}: PalettePopupProps) {
	const planeRef = useRef<HTMLDivElement | null>(null);
	const sliderRef = useRef<HTMLDivElement | null>(null);
	const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const lastXRef = useRef(0);

	const [format, setFormat] = useState<ColourFormat>("HEX");
	const [snapshotImg, setSnapshotImg] = useState<HTMLImageElement | null>(
		null,
	);
	const [snapshotAspectRatio, setSnapshotAspectRatio] = useState(1);
	const [x, setX] = useState(() => {
		const initialHwb = value.toHWB();
		return initialHwb.b === 100
			? 0
			: (1 - initialHwb.w / (100 - initialHwb.b)) * 100;
	});
	const [y, setY] = useState(() => value.toHWB().b);
	const [z, setZ] = useState(() => value.toHWB().h);

	const pickColour = useCallback(
		(targetX: number, targetY: number, targetZ: number) => {
			if (format === "PAGE") {
				const canvas = snapshotCanvasRef.current;
				const ctx = canvas?.getContext("2d", {
					willReadFrequently: true,
				});
				if (!canvas || !ctx) return;
				const pixelX = Math.floor((targetX / 100) * canvas.width);
				const pixelY = Math.floor((targetY / 100) * canvas.height);
				const pixel = ctx.getImageData(
					clamp(0, pixelX, canvas.width - 1),
					clamp(0, pixelY, canvas.height - 1),
					1,
					1,
				).data;
				onChange(
					new Colour()
						.rgb(pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0)
						.toHex(),
				);
			} else {
				lastXRef.current = targetX;
				const w = (100 - targetX) * (1 - targetY / 100);
				const b = targetY;
				onChange(new Colour().hwb(targetZ, w, b).toHex());
			}
		},
		[format, onChange],
	);

	const onMoveStop = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		if (e.currentTarget.hasPointerCapture(e.pointerId))
			e.currentTarget.releasePointerCapture(e.pointerId);
	}, []);

	const onPlaneMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
			if (!planeRef.current) return;
			if (e.buttons === 0) return onMoveStop(e);
			const rect = planeRef.current.getBoundingClientRect();
			const newX =
				clamp(0, (e.clientX - rect.left) / rect.width, 1) * 100;
			const newY =
				clamp(0, (e.clientY - rect.top) / rect.height, 1) * 100;
			setX(newX);
			setY(newY);
			pickColour(newX, newY, z);
		},
		[onMoveStop, pickColour, z],
	);

	const onSliderMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
			if (!sliderRef.current) return;
			if (e.buttons === 0) return onMoveStop(e);
			const rect = sliderRef.current.getBoundingClientRect();
			const newZ =
				360 * clamp(0, (e.clientX - rect.left) / rect.width, 1);
			setZ(newZ);
			pickColour(x, y, newZ);
		},
		[onMoveStop, pickColour, x, y],
	);

	useEffect(() => {
		if (format === "PAGE") {
			let isCancelled = false;
			captureActiveTabSnapshot().then((dataUrl) => {
				if (isCancelled) return;
				if (!dataUrl) return setFormat("HEX");
				const img = new Image();
				img.src = dataUrl;
				img.onload = () => {
					if (isCancelled) return;
					setSnapshotAspectRatio(
						img.naturalWidth / img.naturalHeight,
					);
					setSnapshotImg(img);
				};
			});
			return () => {
				isCancelled = true;
			};
		} else {
			setSnapshotImg(null);
			const w = (100 - x) * (1 - y / 100);
			const b = y;
			const currentHex = new Colour().hwb(z, w, b).toHex();
			if (value.toHex() === currentHex) return;
			const nextHwb = value.toHWB();
			if (nextHwb.w + nextHwb.b < 100) setZ(nextHwb.h);
			setY(nextHwb.b);
			if (nextHwb.b < 100) {
				const newX = (1 - nextHwb.w / (100 - nextHwb.b)) * 100;
				setX(newX);
				lastXRef.current = newX;
			} else {
				setX(lastXRef.current);
			}
		}
	}, [format, value, x, y, z]);

	useEffect(() => {
		if (snapshotImg && snapshotCanvasRef.current) {
			const canvas = snapshotCanvasRef.current;
			canvas.width = snapshotImg.naturalWidth;
			canvas.height = snapshotImg.naturalHeight;
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			ctx?.drawImage(snapshotImg, 0, 0);
			if (format === "PAGE") pickColour(x, y, z);
		}
	}, [snapshotImg, format, pickColour, x, y, z]);

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
				className={clsx(
					styles.plane,
					format === "PAGE" && styles.snapshotPlane,
				)}
				ref={planeRef}
				onPointerDown={(e) => {
					e.currentTarget.setPointerCapture(e.pointerId);
					onPlaneMove(e);
				}}
				onPointerMove={onPlaneMove}
				onPointerUp={onMoveStop}
				onPointerCancel={onMoveStop}
				style={
					{
						backgroundColor:
							format !== "PAGE" ? `hwb(${z} 0% 0%)` : undefined,
						aspectRatio:
							format === "PAGE"
								? `${snapshotAspectRatio}`
								: "1/1",
						"--x": `${x}%`,
						"--y": `${y}%`,
					} as CSSProperties
				}
			>
				{format === "PAGE" && (
					<canvas
						ref={snapshotCanvasRef}
						className={styles.snapshotCanvas}
					/>
				)}
				<div className={styles.planeIris} />
				<div
					className={styles.planePupil}
					style={{ backgroundColor: value.toHex() }}
				/>
			</div>
			{format !== "PAGE" && (
				<div
					className={styles.slider}
					ref={sliderRef}
					onPointerDown={(e) => {
						e.currentTarget.setPointerCapture(e.pointerId);
						onSliderMove(e);
					}}
					onPointerMove={onSliderMove}
					onPointerUp={onMoveStop}
					onPointerCancel={onMoveStop}
					style={{ "--x": `${(z / 360) * 100}%` } as CSSProperties}
				>
					<div className={styles.sliderIris} />
					<div
						className={styles.sliderPupil}
						style={{ backgroundColor: `hwb(${z} 0% 0%)` }}
					/>
				</div>
			)}
			<div className={styles.toolbox}>
				<select
					className={clsx(format === "PAGE" && styles.pageSelect)}
					value={format}
					onChange={(e) => {
						const value = e.target.value;
						if (value === "SYS") openColourInput();
						else {
							const nextFormat = value as ColourFormat;
							if (format === "PAGE" && nextFormat !== "PAGE") {
								const w = (100 - x) * (1 - y / 100);
								const b = y;
								onChange(new Colour().hwb(z, w, b).toHex());
							}
							setFormat(nextFormat);
						}
					}}
				>
					<option value="HEX">HEX</option>
					<option value="RGB">RGB</option>
					<option value="HWB">HWB</option>
					<option value="CSS">CSS</option>
					{inPopup ? (
						<option value="PAGE">{i18n.t("currentPage")}</option>
					) : (
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
									hwb={value.toHWB()}
									onChange={(nextHwb) => {
										setZ(nextHwb.h);
										setY(nextHwb.b);
										if (nextHwb.b < 100) {
											const newX =
												(1 -
													nextHwb.w /
														(100 - nextHwb.b)) *
												100;
											setX(newX);
											lastXRef.current = newX;
										}
										onChange(
											new Colour()
												.hwb(
													nextHwb.h,
													nextHwb.w,
													nextHwb.b,
												)
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
						case "PAGE":
							return (
								<div className={styles.pageHex}>
									{value.toHex()}
								</div>
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
