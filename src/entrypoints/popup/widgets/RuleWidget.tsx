import { useSyncExternalStore } from "react";
import styles from "./RuleWidget.module.css";

interface RuleWidgetProps {
	pref: Preference;
	ruleData: RuleQueryResult;
	metaData: MetaQueryResult;
}

export default function RuleWidget({
	pref,
	ruleData,
	metaData,
}: RuleWidgetProps) {
	useSyncExternalStore(
		(listener) => pref.addOnChangeListener(listener),
		() => pref.getLastSave(),
	);

	return (
		<section className={styles.ruleWidget}>
			<div className={styles.infoMessage}>
				<Icon type="info" inline />
				<span>
					<ReasonText reason={metaData.reason} info={metaData.info} />
				</span>
			</div>
			<RuleControls pref={pref} ruleData={ruleData} metaData={metaData} />
		</section>
	);
}

interface ReasonTextProps {
	reason: TabMetaReason;
	info?: string;
}

function ReasonText({ reason, info }: ReasonTextProps) {
	switch (reason) {
		case "COLOUR_PICKED":
			return i18n.t("usingColourFromWebpage");
		case "COLOUR_SPECIFIED":
			return i18n.t("usingSpecifiedColour");
		case "THEME_USED":
			return i18n.t("usingThemeColour");
		case "THEME_MISSING":
			return i18n.t("themeColourNotFound");
		case "THEME_IGNORED":
			return i18n.t("themeColourIsIgnored");
		case "THEME_UNIGNORED":
			return i18n.t("themeColourIsUnignored");
		case "QS_USED":
			return (
				<>
					{i18n.t("usingColourFromElement")}
					<strong>
						<code>{info}</code>
					</strong>
					{i18n.t("usingColourFromElementEnd")}
				</>
			);
		case "QS_FAILED":
			return (
				<>
					{i18n.t("couldNotFindElement")}
					<strong>
						<code>{info}</code>
					</strong>
					{i18n.t("couldNotFindElementEnd")}
				</>
			);
		case "QS_ERROR":
			return (
				<>
					{i18n.t("errorOccuredLocatingElement")}
					<strong>
						<code>{info}</code>
					</strong>
					{i18n.t("errorOccuredLocatingElementEnd")}
				</>
			);
		case "ADDON_SPECIFIED":
			return (
				<>
					{i18n.t("usingSpecifiedColourForAddon")}
					<strong>{info}</strong>
					{i18n.t("usingSpecifiedColourForAddonEnd")}
				</>
			);
		case "ADDON_PRESET":
			return (
				<>
					{i18n.t("usingPresetColourForAddon")}
					<strong>{info}</strong>
					{i18n.t("usingPresetColourForAddonEnd")}
				</>
			);
		case "ADDON_DEFAULT":
			return (
				<>
					{i18n.t("usingDefaultColourForAddon")}
					<strong>{info}</strong>
					{i18n.t("usingDefaultColourForAddonEnd")}
				</>
			);
		case "HOME_PAGE":
			return i18n.t("usingColourForHomePage");
		case "PROTECTED_PAGE":
			return i18n.t("pageIsProtected");
		case "IMAGE_VIEWER":
			return i18n.t("usingImageViewer");
		case "PDF_VIEWER":
			return i18n.t("usingColourForPDFViewer");
		case "JSON_VIEWER":
			return i18n.t("usingColourForJSONViewer");
		case "TEXT_VIEWER":
			return i18n.t("usingColourForPlainTextViewer");
		case "FALLBACK_COLOUR":
			return i18n.t("usingFallbackColour");
		default:
			return i18n.t("errorOccured");
	}
}

interface RuleControlsProps {
	pref: Preference;
	ruleData: RuleQueryResult;
	metaData: MetaQueryResult;
}

function RuleControls({ pref, ruleData, metaData }: RuleControlsProps) {
	if (ruleData.id !== 0) {
		return (
			<>
				<RuleCard
					inPopup
					rule={ruleData.rule}
					onChange={(newRule) => pref.setRule(ruleData.id, newRule)}
				/>
				<button
					className={styles.controlButton}
					onClick={() => {
						pref.setRule(ruleData.id, null);
					}}
				>
					{i18n.t("deleteRule")}
				</button>
			</>
		);
	} else if (
		["THEME_IGNORED", "THEME_USED", "COLOUR_PICKED"].includes(
			metaData.reason,
		) &&
		URL.canParse(ruleData.url)
	) {
		const { hostname } = new URL(ruleData.url);
		return (
			<button
				className={styles.controlButton}
				onClick={() => {
					pref.addRule({
						headerType: "URL",
						header: hostname,
						type: "COLOUR",
						value: new colour().random().toHex(),
						scheme: "both",
					});
				}}
			>
				{i18n.t("addANewRule")}
			</button>
		);
	} else if (
		["ADDON_DEFAULT", "ADDON_PRESET"].includes(metaData.reason) &&
		ruleData.webExtId !== undefined
	) {
		const webExtId = ruleData.webExtId;
		return (
			<button
				className={styles.controlButton}
				onClick={() => {
					pref.addRule({
						headerType: "ADDON_ID",
						header: webExtId,
						type: "COLOUR",
						value: new colour().random().toHex(),
						scheme: "both",
					});
				}}
			>
				{i18n.t("addANewRule")}
			</button>
		);
	} else if (metaData.reason === "HOME_PAGE") {
		return (
			<div className={styles.colourWrapper}>
				<div>
					<Palette
						inPopup
						value={pref.homeBackground_light}
						onChange={(value) =>
							(pref.homeBackground_light = value)
						}
					/>
					<h4>
						{i18n.t("inLightMode")}
						<button
							className={styles.resetButton}
							title={i18n.t("reset")}
							onClick={() => pref.reset(["homeBackground_light"])}
						>
							<Icon type="reset" size="text" />
						</button>
					</h4>
				</div>
				<div>
					<Palette
						inPopup
						value={pref.homeBackground_dark}
						onChange={(value) => (pref.homeBackground_dark = value)}
					/>
					<h4>
						{i18n.t("inDarkMode")}
						<button
							className={styles.resetButton}
							title={i18n.t("reset")}
							onClick={() => pref.reset(["homeBackground_dark"])}
						>
							<Icon type="reset" size="text" />
						</button>
					</h4>
				</div>
			</div>
		);
	} else return null;
}
