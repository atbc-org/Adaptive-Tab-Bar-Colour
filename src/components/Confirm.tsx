import styles from "./Confirm.module.css";

interface ConfirmProps {
	children: (open: () => void) => ReactNode;
	confirmText: string;
	onConfirm: () => void;
}

export default function Confirm({
	children,
	confirmText,
	onConfirm,
}: ConfirmProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const onPointerDown = (event: PointerEvent) => {
			if (!containerRef.current?.contains(event.target as Node))
				setIsOpen(false);
		};
		if (!isOpen) return;
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, [isOpen]);

	useEffect(() => {
		const onBlur = () => setIsOpen(false);
		document.addEventListener("blur", onBlur);
		return () => document.removeEventListener("blur", onBlur);
	}, []);

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
							{i18n.t("yes")}
						</button>
						<button onClick={() => setIsOpen(false)}>
							{i18n.t("no")}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
