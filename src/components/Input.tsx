import styles from "./Input.module.css";

interface InputProps {
	value?: string;
	inPopup?: boolean;
	placeholder?: string;
	warning?: string;
	onChange: (newValue: string) => void;
}

export default function Input({
	value = "",
	inPopup = false,
	placeholder = "",
	warning = "",
	onChange,
}: InputProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState(value);

	return (
		<div
			className={clsx(
				styles.input,
				value === "" && warning !== "" && styles.warning,
			)}
		>
			<input
				className={clsx(inPopup && styles.inPopup)}
				type="text"
				placeholder={placeholder}
				title={placeholder}
				value={isEditing ? text : value}
				onFocus={() => {
					setIsEditing(true);
					setText(value);
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
			<div title={warning}>
				<Icon type="warning" />
			</div>
		</div>
	);
}
