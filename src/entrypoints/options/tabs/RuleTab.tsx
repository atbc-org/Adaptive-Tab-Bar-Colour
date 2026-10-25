import styles from "./RuleTab.module.css";

interface RuleTabProps {
	prefs: Prefs;
	ready: boolean;
}

export default function RuleTab({ prefs, ready }: RuleTabProps) {
	const rules = Object.entries(prefs.rules).sort(
		([, first], [, second]) => first.order - second.order,
	);

	return (
		<main className={clsx(styles.ruleTab, !ready && "disabled")}>
			<div className={styles.ruleList}>
				{rules.map(([id, rule]) => {
					return (
						<RuleCard
							key={`rule-${id}`}
							rule={rule}
							onChange={(newRule) => void setRule(id, newRule)}
						/>
					);
				})}
			</div>
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
