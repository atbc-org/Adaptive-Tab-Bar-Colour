import styles from "./Switch.module.css";

interface SwitchProps {
	active?: boolean;
	onChange: (nextValue: boolean) => void;
}

export default function Switch({ active = false, onChange }: SwitchProps) {
	return (
		<button
			className={clsx(styles.switch, active && styles.active)}
			onClick={() => onChange(!active)}
		></button>
	);
}
