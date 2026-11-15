import styles from "./Popover.module.css";

export interface PopoverLocation {
	orientation: "north" | "south";
	deviation: "none" | "left" | "right";
}

export interface PopoverProps {
	children: (open: () => void, isOpen: boolean) => ReactNode;
	content: ReactNode;
	onConfirm?: () => void;
	onCancel?: () => void;
	confirmLabel?: string;
	cancelLabel?: string;
	showCancel?: boolean;
	inline?: boolean;
}

export default function Popover({
	children,
	content,
	onConfirm,
	onCancel,
	confirmLabel,
	cancelLabel,
	showCancel = true,
	inline = false,
}: PopoverProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [location, setLocation] = useState<PopoverLocation>({
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
		<div
			className={clsx(styles.popover, inline && styles.inline)}
			ref={containerRef}
		>
			{children(() => setIsOpen(!isOpen), isOpen)}
			{isOpen && (
				<div
					ref={menuRef}
					className={clsx(
						styles.popoverMenu,
						location.orientation === "north" && styles.popoverNorth,
						location.orientation === "south" && styles.popoverSouth,
						location.deviation === "left" && styles.popoverLeft,
						location.deviation === "right" && styles.popoverRight,
					)}
				>
					<div className={styles.popoverContent}>{content}</div>
					<div className={styles.popoverActions}>
						<button
							onClick={() => {
								onConfirm?.();
								setIsOpen(false);
							}}
						>
							{confirmLabel ?? i18n.t("yes")}
						</button>
						{showCancel && (
							<button
								onClick={() => {
									onCancel?.();
									setIsOpen(false);
								}}
							>
								{cancelLabel ?? i18n.t("no")}
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
