import styles from "./Confirm.module.css";

interface ConfirmProps {
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
	const containerRef = useRef<HTMLDivElement | null>(null);

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
				<div className={styles.confirmMenu}>
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
