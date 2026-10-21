import styles from "./Switch.module.css";

interface SwitchProps {
	active?: boolean;
	label?: string;
	disabled?: boolean;
	onChange: (nextValue: boolean) => void;
}

export default function Switch({
	active = false,
	label,
	disabled = false,
	onChange,
}: SwitchProps) {
	return (
		<button
			type="button"
			disabled={disabled}
			role="switch"
			aria-checked={active}
			aria-label={label}
			className={clsx(styles.switch, active && styles.active)}
			onClick={() => onChange(!active)}
		></button>
	);
}
