import styles from "./Slider.module.css";

interface SliderProps {
	inPopup?: boolean;
	minValue?: number;
	maxValue?: number;
	minorStep?: number;
	majorStep?: number;
	value?: number;
	leftIconType: IconType;
	rightIconType: IconType;
	onChange: (newValue: number) => void;
	onCommit?: (oldValue: number, newValue: number) => void;
	onDisplay?: (value: number) => string;
}

export default function Slider({
	inPopup = false,
	minValue = -50,
	maxValue = 50,
	minorStep = 1,
	majorStep = 5,
	value = minValue,
	leftIconType,
	rightIconType,
	onChange,
	onCommit = () => {},
	onDisplay = (value) => `${value}%`,
}: SliderProps) {
	return (
		<div className={styles.slider}>
			<button
				className={clsx(inPopup && styles.popupButton)}
				onPointerDown={() => {
					const newValue = clamp(
						minValue,
						(Math.ceil(value / majorStep) - 1) * majorStep,
						maxValue,
					);
					if (value !== newValue) {
						onChange(newValue);
						onCommit(value, newValue);
					}
				}}
			>
				<Icon
					type={leftIconType}
					size={inPopup ? "small" : "default"}
				/>
			</button>
			{inPopup ? (
				<div className={styles.popupDisplay}>{onDisplay(value)}</div>
			) : (
				<SliderTrack
					minValue={minValue}
					maxValue={maxValue}
					minorStep={minorStep}
					value={value}
					onChange={onChange}
					onCommit={onCommit}
					onDisplay={onDisplay}
				/>
			)}
			<button
				className={clsx(inPopup && styles.popupButton)}
				onPointerDown={() => {
					const newValue = clamp(
						minValue,
						(Math.floor(value / majorStep) + 1) * majorStep,
						maxValue,
					);
					if (value !== newValue) {
						onChange(newValue);
						onCommit(value, newValue);
					}
				}}
			>
				<Icon
					type={rightIconType}
					size={inPopup ? "small" : "default"}
				/>
			</button>
		</div>
	);
}

interface SliderTrackProps {
	minValue: number;
	maxValue: number;
	minorStep: number;
	value: number;
	onChange: (newValue: number) => void;
	onCommit: (oldValue: number, newValue: number) => void;
	onDisplay: (value: number) => string;
}

function SliderTrack({
	minValue,
	maxValue,
	minorStep,
	value,
	onChange,
	onCommit,
	onDisplay,
}: SliderTrackProps) {
	const rafRef = useRef<number | null>(null);
	const trackRef = useRef<HTMLDivElement | null>(null);
	const dragRef = useRef({
		rect: null as DOMRect | null,
		offset: 0,
		thumbWidth: 0,
		startValue: value,
		transientValue: value,
	});
	const [isDragging, setIsDragging] = useState(false);
	const [transientValue, setTransientValue] = useState(value);

	useEffect(
		() => () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
		},
		[],
	);

	const displayValue = isDragging ? transientValue : value;

	const onDragStop = useCallback(
		(e: React.PointerEvent<HTMLDivElement>): void => {
			if (e.currentTarget.hasPointerCapture(e.pointerId))
				e.currentTarget.releasePointerCapture(e.pointerId);
			const state = dragRef.current;
			state.rect = null;
			setIsDragging(false);
			if (state.startValue !== state.transientValue) {
				onChange(state.transientValue);
				onCommit(state.startValue, state.transientValue);
			}
		},
		[onChange, onCommit],
	);

	const onDrag = useCallback(
		(e: React.PointerEvent<HTMLDivElement>): void => {
			if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
			if (e.buttons === 0) return onDragStop(e);

			const state = dragRef.current;
			const rect =
				state.rect ?? trackRef.current?.getBoundingClientRect();
			if (!rect) return;

			const newValue = clamp(
				minValue,
				Math.round(
					(clamp(
						0,
						(e.clientX - state.offset - rect.left) /
							(rect.width - state.thumbWidth),
						1,
					) *
						(maxValue - minValue) +
						minValue) /
						minorStep,
				) * minorStep,
				maxValue,
			);

			if (newValue !== state.transientValue) {
				if (rafRef.current !== null)
					cancelAnimationFrame(rafRef.current);
				rafRef.current = requestAnimationFrame(() => {
					state.transientValue = newValue;
					setTransientValue(newValue);
					onChange(newValue);
				});
			}
		},
		[minValue, maxValue, minorStep, onChange, onDragStop],
	);

	return (
		<div
			ref={trackRef}
			className={clsx(styles.track, isDragging && styles.dragging)}
			style={
				{
					"--percent": (value - minValue) / (maxValue - minValue),
				} as CSSProperties
			}
		>
			<div className={styles.fill} />
			<div
				className={styles.thumb}
				onPointerDown={(e) => {
					e.currentTarget.setPointerCapture(e.pointerId);
					const state = dragRef.current;
					state.rect =
						trackRef.current?.getBoundingClientRect() ?? null;
					const thumbRect = e.currentTarget.getBoundingClientRect();
					state.offset = e.clientX - thumbRect.left;
					state.thumbWidth = thumbRect.width;
					state.startValue = value;
					state.transientValue = value;

					setTransientValue(value);
					setIsDragging(true);
					onDrag(e);
				}}
				onPointerMove={onDrag}
				onPointerUp={onDragStop}
				onPointerCancel={onDragStop}
			/>
			<div className={styles.display}>{onDisplay(displayValue)}</div>
		</div>
	);
}
