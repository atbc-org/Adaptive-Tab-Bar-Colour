import styles from "./Confirm.module.css";

export interface ConfirmLocation {
	orientation: "north" | "south";
	deviation: "none" | "left" | "right";
}

export interface ConfirmProps {
	children: (open: () => void) => ReactNode;
	confirmText: string;
	onConfirm: () => void;
	onCancel?: () => void;
	confirmLabel?: string;
	cancelLabel?: string;
}

export default function Confirm({
	children,
	confirmText,
	onConfirm,
	onCancel,
	confirmLabel,
	cancelLabel,
}: ConfirmProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [location, setLocation] = useState<ConfirmLocation>({
		orientation: "south",
		deviation: "none",
	});
	const containerRef = useRef<HTMLDivElement | null>(null);

	const updateLocation = useCallback(() => {
		const container = containerRef.current;
		if (!container)
			return setLocation({ orientation: "south", deviation: "none" });
		const rect = container.getBoundingClientRect();
		const width = 120;
		const height = 120;
		const top = rect.top;
		const bottom = window.innerHeight - rect.bottom;
		const left = rect.left + rect.width / 2;
		const right = window.innerWidth - left;
		const orientation =
			bottom >= height || top < height ? "south" : "north";
		const deviation =
			left >= width && right >= width
				? "none"
				: left < width
					? "right"
					: "left";
		setLocation({ orientation, deviation });
	}, []);

	useEffect(() => {
		if (!isOpen) return;
		const onPointerDown = (event: PointerEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};
		const onBlur = () => setIsOpen(false);

		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("blur", onBlur);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
			document.removeEventListener("blur", onBlur);
		};
	}, [isOpen]);

	return (
		<div className={styles.confirm} ref={containerRef}>
			{children(() => {
				if (!isOpen) updateLocation();
				setIsOpen(!isOpen);
			})}
			{isOpen && (
				<div
					className={clsx(
						styles.confirmMenu,
						location.orientation === "north" && styles.confirmNorth,
						location.orientation === "south" && styles.confirmSouth,
						location.deviation === "left" && styles.confirmLeft,
						location.deviation === "right" && styles.confirmRight,
					)}
				>
					<div className={styles.confirmText}>{confirmText}</div>
					<div className={styles.confirmActions}>
						<button
							onClick={() => {
								onConfirm();
								setIsOpen(false);
							}}
						>
							{confirmLabel ?? i18n.t("yes")}
						</button>
						<button
							onClick={() => {
								onCancel?.();
								setIsOpen(false);
							}}
						>
							{cancelLabel ?? i18n.t("no")}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
