import clsx from "clsx";
import { useSyncExternalStore } from "react";
import styles from "./RuleTab.module.css";

interface RuleTabProps {
	pref: Preference;
	ready: boolean;
}

export default function RuleTab({ pref, ready }: RuleTabProps) {
	useSyncExternalStore(
		(listener) => pref.addOnChangeListener(listener),
		() => pref.getLastSave(),
	);

	const ruleList = Object.entries(pref.ruleList).filter(
		([_, rule]) => rule !== null,
	);

	return (
		<main className={clsx(styles.ruleTab, !ready && "disabled")}>
			<div className={styles.ruleList}>
				{ruleList.map(([rawId, rule]) => {
					return (
						<RuleCard
							key={`rule${rawId}`}
							rule={rule}
							onChange={(newRule) =>
								pref.setRule(Number(rawId), newRule)
							}
						/>
					);
				})}
			</div>
			<button
				className={clsx(
					styles.addRuleButton,
					ruleList.length > 0 && styles.marginTop,
				)}
				onClick={() => {
					pref.addRule({
						headerType: "URL",
						header: "",
						type: "COLOUR",
						value: new colour().random().toHex(),
						scheme: "both",
					});
					pref.syncUI();
				}}
			>
				{i18n.t("addANewRule")}
			</button>
		</main>
	);
}
