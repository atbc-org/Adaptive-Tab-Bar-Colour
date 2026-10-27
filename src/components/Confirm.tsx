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
	const menuRef = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => {
		if (!isOpen || !containerRef.current || !menuRef.current) return;
		const containerRect = containerRef.current.getBoundingClientRect();
		const menuRect = menuRef.current.getBoundingClientRect();
		const width = (menuRect.width || 240) / 2;
		const height = menuRect.height || 120;
		const top = containerRect.top;
		const bottom = window.innerHeight - containerRect.bottom;
		const left = containerRect.left + containerRect.width / 2;
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
	}, [isOpen]);

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
			{children(() => setIsOpen(!isOpen))}
			{isOpen && (
				<div
					ref={menuRef}
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
