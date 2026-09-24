import styles from "./Palette.module.css";

interface PaletteProps {
	value?: string;
	inPopup?: boolean;
	onChange: (newValue: string) => void;
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
	const [popupLocation, setPopupLocation] = useState<PopupLocation>({
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
