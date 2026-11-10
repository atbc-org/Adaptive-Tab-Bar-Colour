import styles from "./RuleTab.module.css";

interface RuleTabProps {
	pref: Prefs;
	ready: boolean;
}

export default function RuleTab({ pref, ready }: RuleTabProps) {
	const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
	const [hoverIndex, setHoverIndex] = useState<number | null>(null);

	const listRef = useRef<HTMLDivElement>(null);
	const floatingRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<{
		pointerId: number;
		fromIndex: number;
		toIndex: number;
		startY: number;
		initialTop: number;
		height: number;
		maxTop: number;
		slotTops: number[];
	} | null>(null);

	const rules = useMemo(
		() =>
			Object.entries(pref.rule).sort(
				([, first], [, second]) => first.order - second.order,
			),
		[pref.rule],
	);

	const getShiftState = (index: number): "up" | "down" | "none" => {
		if (dragFromIndex === null || hoverIndex === null) return "none";
		if (index > dragFromIndex && index <= hoverIndex) return "up";
		if (index < dragFromIndex && index >= hoverIndex) return "down";
		return "none";
	};

	const handleGrab = (
		fromIndex: number,
		e: React.PointerEvent<HTMLElement>,
	) => {
		if (e.button !== 0 || !listRef.current) return;
		e.preventDefault();

		const cards = Array.from(listRef.current.children) as HTMLElement[];
		const fromCard = cards[fromIndex];
		if (!fromCard) return;

		try {
			document.documentElement.setPointerCapture(e.pointerId);
		} catch {}

		const initialTop = fromCard.offsetTop;
		const height = fromCard.offsetHeight;
		const maxTop = Math.max(0, listRef.current.offsetHeight - height);
		const slotTops = cards.map((el) => el.offsetTop);

		dragRef.current = {
			pointerId: e.pointerId,
			fromIndex,
			toIndex: fromIndex,
			startY: e.pageY,
			initialTop,
			height,
			maxTop,
			slotTops,
		};

		setDragFromIndex(fromIndex);
		setHoverIndex(fromIndex);
	};

	useLayoutEffect(() => {
		if (dragFromIndex === null || !floatingRef.current || !dragRef.current)
			return;
		floatingRef.current.style.setProperty(
			"--drag-y",
			`${dragRef.current.initialTop}px`,
		);
	}, [dragFromIndex]);

	useEffect(() => {
		const state = dragRef.current;
		if (dragFromIndex === null || !state) return;

		document.documentElement.classList.add("is-dragging-rule");
		document.body.classList.add("is-dragging-rule");

		const updatePosition = (top: number, toIndex: number) => {
			floatingRef.current?.style.setProperty("--drag-y", `${top}px`);
			if (state.toIndex !== toIndex) {
				state.toIndex = toIndex;
				setHoverIndex(toIndex);
			}
		};

		const cancelDrag = () => {
			try {
				document.documentElement.releasePointerCapture(state.pointerId);
			} catch {}
			dragRef.current = null;
			document.documentElement.classList.remove("is-dragging-rule");
			document.body.classList.remove("is-dragging-rule");
			setDragFromIndex(null);
			setHoverIndex(null);
		};

		const finishDrag = () => {
			const { fromIndex, toIndex } = state;
			cancelDrag();
			if (fromIndex === toIndex) return;

			const reordered = [...rules];
			const [moved] = reordered.splice(fromIndex, 1);
			if (!moved) return;
			reordered.splice(toIndex, 0, moved);
			reordered.forEach(([ruleId, currentRule], index) => {
				const newOrder = index + 1;
				if (currentRule.order !== newOrder)
					pref.rule[ruleId] = { ...currentRule, order: newOrder };
			});
		};

		const handlePointerMove = (e: PointerEvent) => {
			if (e.buttons === 0) {
				finishDrag();
				return;
			}

			const isOutside =
				e.clientX < 0 ||
				e.clientX >= window.innerWidth ||
				e.clientY < 0 ||
				e.clientY >= window.innerHeight;

			if (isOutside) {
				finishDrag();
				return;
			}

			const deltaY = e.pageY - state.startY;
			const currentTop = clamp(
				0,
				state.initialTop + deltaY,
				state.maxTop,
			);
			const draggedCenter = currentTop + state.height / 2;
			const toIndex = Math.max(
				0,
				state.slotTops.findLastIndex((top) => draggedCenter >= top),
			);

			updatePosition(currentTop, toIndex);
		};

		const handleMouseLeave = (e: MouseEvent) => {
			if (e.relatedTarget === null) finishDrag();
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") cancelDrag();
		};

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", finishDrag);
		window.addEventListener("pointercancel", finishDrag);
		window.addEventListener("blur", finishDrag);
		window.addEventListener("resize", cancelDrag);
		window.addEventListener("keydown", handleKeyDown);
		document.documentElement.addEventListener(
			"lostpointercapture",
			finishDrag,
		);
		document.documentElement.addEventListener("mouseout", handleMouseLeave);
		document.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			try {
				document.documentElement.releasePointerCapture(state.pointerId);
			} catch {}
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", finishDrag);
			window.removeEventListener("pointercancel", finishDrag);
			window.removeEventListener("blur", finishDrag);
			window.removeEventListener("resize", cancelDrag);
			window.removeEventListener("keydown", handleKeyDown);
			document.documentElement.removeEventListener(
				"lostpointercapture",
				finishDrag,
			);
			document.documentElement.removeEventListener(
				"mouseout",
				handleMouseLeave,
			);
			document.removeEventListener("mouseleave", handleMouseLeave);
			document.documentElement.classList.remove("is-dragging-rule");
			document.body.classList.remove("is-dragging-rule");
		};
	}, [dragFromIndex, rules, pref.rule]);

	return (
		<main className={clsx(styles.ruleTab, !ready && "disabled")}>
			<div
				className={clsx(
					styles.ruleList,
					dragFromIndex !== null && styles.isDragging,
				)}
				ref={listRef}
			>
				{rules.map(([id, rule], index) => {
					const shiftState = getShiftState(index);
					const visualIndex =
						shiftState === "up"
							? index - 1
							: shiftState === "down"
								? index + 1
								: index;
					return (
						<RuleCard
							key={`rule-${id}`}
							rule={rule}
							isPlaceholder={dragFromIndex === index}
							shiftState={shiftState}
							isTop={visualIndex === 0}
							isBottom={visualIndex === rules.length - 1}
							isAlt={index % 2 !== 0}
							onGrab={(e) => handleGrab(index, e)}
							onChange={(newRule) => {
								if (newRule) pref.rule[id] = newRule;
								else delete pref.rule[id];
							}}
						/>
					);
				})}
			</div>
			{dragFromIndex !== null && rules[dragFromIndex] && (
				<div
					ref={floatingRef}
					className={clsx(
						styles.floatingCard,
						hoverIndex === 0 && styles.isTop,
						hoverIndex === rules.length - 1 && styles.isBottom,
					)}
				>
					<RuleCard
						rule={rules[dragFromIndex][1]}
						isTop={hoverIndex === 0}
						isBottom={hoverIndex === rules.length - 1}
						isAlt={dragFromIndex % 2 !== 0}
						onChange={() => {}}
					/>
				</div>
			)}
			<button
				className={clsx(
					styles.addRuleButton,
					rules.length > 0 && styles.marginTop,
				)}
				onClick={() => {
					void addRule({
						target: "URL",
						header: "",
						type: "COLOUR",
						value: new Colour().random().toHex(),
						scheme: "both",
					});
				}}
			>
				{i18n.t("addANewRule")}
			</button>
		</main>
	);
}
