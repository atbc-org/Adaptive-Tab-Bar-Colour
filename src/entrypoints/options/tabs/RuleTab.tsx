import styles from "./RuleTab.module.css";

interface RuleTabProps {
	pref: Prefs;
	ready: boolean;
}

export default function RuleTab({ pref, ready }: RuleTabProps) {
	const rules = Object.entries(pref.rule).sort(
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
							onChange={(newRule) => {
								if (newRule) pref.rule[id] = newRule;
								else delete pref.rule[id];
							}}
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
