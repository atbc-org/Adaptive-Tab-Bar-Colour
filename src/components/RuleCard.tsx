import styles from "./RuleCard.module.css";

const defaultValue = {
	COLOUR: new Colour().random().toHex(),
	THEME_COLOUR: true,
	QUERY_SELECTOR: "",
};

interface RuleCardProps {
	rule?: Rule;
	inPopup?: boolean;
	onChange: (newRule: Rule | null) => void;
}

export default function RuleCard({
	rule,
	inPopup = false,
	onChange,
}: RuleCardProps) {
	if (!rule) return null;

	const [webExtName, setWebExtName] = useState(rule?.header);

	useEffect(() => {
		if (rule?.target === "ADDON_ID")
			getWebExtName(rule.header).then((name) =>
				setWebExtName(name ?? i18n.t("addonNotFound")),
			);
	}, [rule?.header, rule?.target]);

	return (
		<section className={clsx(styles.ruleCard, inPopup && styles.inPopup)}>
			{!inPopup &&
				(rule.target === "ADDON_ID" ? (
					<div className={styles.webExtHeader}>{webExtName}</div>
				) : (
					<Input
						value={rule.header}
						placeholder={i18n.t("urlDomainOrRegex")}
						warning={i18n.t("ruleWillBeIgnored")}
						onChange={(newHeader) =>
							onChange({ ...rule, header: newHeader })
						}
					/>
				))}
			<select
				value={rule.type}
				title={(() => {
					switch (rule.type) {
						case "COLOUR":
							return i18n.t("specifyAColour");
						case "THEME_COLOUR":
							return i18n.t("useIgnoreThemeColour");
						case "QUERY_SELECTOR":
							return i18n.t("pickColourFromElement");
					}
				})()}
				onChange={(e) => {
					switch (e.target.value) {
						case "COLOUR":
							onChange({
								...rule,
								type: "COLOUR",
								value: defaultValue.COLOUR,
							});
							break;
						case "THEME_COLOUR":
							onChange({
								...rule,
								target: "URL",
								type: "THEME_COLOUR",
								value: defaultValue.THEME_COLOUR,
							});
							break;
						default:
							onChange({
								...rule,
								target: "URL",
								type: "QUERY_SELECTOR",
								value: defaultValue.QUERY_SELECTOR,
							});
							break;
					}
				}}
			>
				<option value="COLOUR">{i18n.t("specifyAColour")}</option>
				{rule.target === "URL" ? (
					<>
						<option value="THEME_COLOUR">
							{i18n.t("useIgnoreThemeColour")}
						</option>
						<option value="QUERY_SELECTOR">
							{i18n.t("pickColourFromElement")}
						</option>
					</>
				) : (
					<>
						<option disabled>
							{i18n.t("useIgnoreThemeColour")}
						</option>
						<option disabled>
							{i18n.t("pickColourFromElement")}
						</option>
					</>
				)}
			</select>
			{(() => {
				switch (rule.type) {
					case "COLOUR":
						return (
							<Palette
								value={rule.value}
								inPopup={inPopup}
								onChange={(newValue) =>
									onChange({ ...rule, value: newValue })
								}
							/>
						);
					case "THEME_COLOUR":
						return (
							<Toggle
								itemList={[i18n.t("use"), i18n.t("ignore")]}
								activeIndex={rule.value ? 0 : 1}
								onChange={(newIndex) =>
									onChange({ ...rule, value: newIndex === 0 })
								}
							/>
						);
					case "QUERY_SELECTOR":
						return (
							<Input
								value={rule.value}
								inPopup={inPopup}
								placeholder={i18n.t("querySelector")}
								onChange={(newValue) =>
									onChange({ ...rule, value: newValue })
								}
							/>
						);
					default:
						return null;
				}
			})()}
			{!inPopup && (
				<span>
					<button
						className={styles.button}
						title={(() => {
							switch (rule.scheme) {
								case "both":
									return i18n.t("ruleAppliedInBothMode");
								case "light":
									return i18n.t("ruleAppliedInLightMode");
								case "dark":
									return i18n.t("ruleAppliedInDarkMode");
							}
						})()}
						onClick={async () => {
							onChange({
								...rule,
								scheme: await (async () => {
									if (
										(await getCurrentScheme()) === "light"
									) {
										switch (rule.scheme) {
											case "both":
												return "light";
											case "light":
												return "dark";
											case "dark":
												return "both";
										}
									} else {
										switch (rule.scheme) {
											case "both":
												return "dark";
											case "dark":
												return "light";
											case "light":
												return "both";
										}
									}
								})(),
							});
						}}
					>
						<Icon
							type={(() => {
								switch (rule.scheme) {
									case "both":
										return "sunMoon";
									case "dark":
										return "moon";
									case "light":
										return "sun";
								}
							})()}
						/>
					</button>
					<button
						className={styles.button}
						title={i18n.t("delete")}
						onClick={() => onChange(null)}
					>
						<Icon type="delete" />
					</button>
				</span>
			)}
		</section>
	);
}
