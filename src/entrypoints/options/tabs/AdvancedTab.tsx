import clsx from "clsx";
import { useSyncExternalStore } from "react";
import styles from "./AdvancedTab.module.css";

interface AdvancedTabProps {
	pref: Preference;
	ready: boolean;
}

export default function AdvancedTab({ pref, ready }: AdvancedTabProps) {
	useSyncExternalStore(
		(listener) => pref.addOnChangeListener(listener),
		() => pref.getLastSave(),
	);

	const scheme = useCurrentScheme();
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	return (
		<main className={clsx(styles.advancedTab, !ready && "disabled")}>
			<div className={styles.column}>
				<section className={styles.cardSection}>
					<label className={styles.switchWrapper}>
						<Switch
							active={pref.nova}
							onChange={(value) => (pref.nova = value)}
						/>
						<div>
							<h3>{i18n.t("novaUi")}</h3>
							<p>{i18n.t("novaUiTooltip")}</p>
						</div>
					</label>
				</section>
				<section
					className={clsx(
						styles.cardSection,
						pref.compatibilityMode && "disabled",
					)}
				>
					<label className={styles.switchWrapper}>
						<Switch
							active={pref.allowDarkLight}
							onChange={(value) => (pref.allowDarkLight = value)}
						/>
						{scheme === "light" ? (
							<div>
								<h3>{i18n.t("allowDarkTabBar")}</h3>
								<p>{i18n.t("allowDarkTabBarTooltip")}</p>
							</div>
						) : (
							<div>
								<h3>{i18n.t("allowLightTabBar")}</h3>
								<p>{i18n.t("allowLightTabBarTooltip")}</p>
							</div>
						)}
					</label>
				</section>
				<section className={styles.cardSection}>
					<label className={styles.switchWrapper}>
						<Switch
							active={pref.dynamic}
							onChange={(value) => (pref.dynamic = value)}
						/>
						<div>
							<h3>{i18n.t("dynamicColourUpdate")}</h3>
							<p>{i18n.t("dynamicModeTooltip")}</p>
						</div>
					</label>
				</section>
				<section className={styles.cardSection}>
					<label className={styles.switchWrapper}>
						<Switch
							active={pref.noThemeColour}
							onChange={(value) => (pref.noThemeColour = value)}
						/>
						<div>
							<h3>{i18n.t("ignoreDesignatedThemeColour")}</h3>
							<p>
								{i18n.t("ignoreDesignatedThemeColourTooltip")}
							</p>
						</div>
					</label>
				</section>
				<section className={styles.cardSection}>
					<label className={styles.switchWrapper}>
						<Switch
							active={pref.compatibilityMode}
							onChange={(value) =>
								(pref.compatibilityMode = value)
							}
						/>
						<div>
							<h3>{i18n.t("compatibilityMode")}</h3>
							<p>{i18n.t("compatibilityModeTooltip")}</p>
						</div>
					</label>
				</section>
				<section
					className={clsx(
						styles.cardSection,
						pref.compatibilityMode && "disabled",
					)}
				>
					<label className={styles.switchWrapper}>
						<Switch
							active={pref.overwriteAccentColour}
							onChange={(value) => {
								if (pref.nova) {
									pref.accentColour_light =
										default_accentColourNova_light;
									pref.accentColour_dark =
										default_accentColourNova_dark;
								} else {
									pref.reset(["accentColour_light"]);
									pref.reset(["accentColour_dark"]);
								}
								pref.overwriteAccentColour = value;
							}}
						/>
						<div>
							<h3>{i18n.t("overwriteAccentColour")}</h3>
							<p>{i18n.t("overwriteAccentColourTooltip")}</p>
						</div>
					</label>
					{pref.overwriteAccentColour && (
						<div className={styles.colourWrapper}>
							<div>
								<Palette
									value={pref.accentColour_light}
									onChange={(value) =>
										(pref.accentColour_light = value)
									}
								/>
								<h4>
									{i18n.t("inLightMode")}
									<button
										className={styles.resetButton}
										title={i18n.t("reset")}
										onClick={() => {
											if (pref.nova) {
												pref.accentColour_light =
													default_accentColourNova_light;
											} else {
												pref.reset([
													"accentColour_light",
												]);
											}
										}}
									>
										<Icon type="reset" size="text" />
									</button>
								</h4>
							</div>
							<div>
								<Palette
									value={pref.accentColour_dark}
									onChange={(value) =>
										(pref.accentColour_dark = value)
									}
								/>
								<h4>
									{i18n.t("inDarkMode")}
									<button
										className={styles.resetButton}
										title={i18n.t("reset")}
										onClick={() => {
											if (pref.nova) {
												pref.accentColour_dark =
													default_accentColourNova_dark;
											} else {
												pref.reset([
													"accentColour_dark",
												]);
											}
										}}
									>
										<Icon type="reset" size="text" />
									</button>
								</h4>
							</div>
						</div>
					)}
				</section>
			</div>
			<div className={styles.column}>
				<section className={styles.cardSection}>
					<h3>{i18n.t("minimumContrast")}</h3>
					<p>{i18n.t("minimumContrastTooltip")}</p>
					<div className={styles.sliderWrapper}>
						<Slider
							minValue={0}
							maxValue={210}
							minorStep={5}
							majorStep={15}
							value={pref.minContrast_light}
							leftIconType="circle"
							rightIconType="contrast"
							onDisplay={(value) => (value / 10).toFixed(1)}
							onChange={(value) =>
								(pref.minContrast_light = value)
							}
						/>
						<h4>{i18n.t("inLightMode")}</h4>
					</div>
					<div className={styles.sliderWrapper}>
						<Slider
							minValue={0}
							maxValue={210}
							minorStep={5}
							majorStep={15}
							value={pref.minContrast_dark}
							leftIconType="circle"
							rightIconType="contrast"
							onDisplay={(value) => (value / 10).toFixed(1)}
							onChange={(value) =>
								(pref.minContrast_dark = value)
							}
						/>
						<h4>{i18n.t("inDarkMode")}</h4>
					</div>
				</section>
				<section
					className={clsx(
						styles.listSection,
						pref.compatibilityMode && "disabled",
					)}
				>
					<div>
						<h3>{i18n.t("homepageColourLight")}</h3>
						<Palette
							value={pref.homeBackground_light}
							onChange={(value) =>
								(pref.homeBackground_light = value)
							}
						/>
					</div>
					<div>
						<h3>{i18n.t("homepageColourDark")}</h3>
						<Palette
							value={pref.homeBackground_dark}
							onChange={(value) =>
								(pref.homeBackground_dark = value)
							}
						/>
					</div>
					<div>
						<h3>{i18n.t("fallbackColourLight")}</h3>
						<Palette
							value={pref.fallbackColour_light}
							onChange={(value) =>
								(pref.fallbackColour_light = value)
							}
						/>
					</div>
					<div>
						<h3>{i18n.t("fallbackColourDark")}</h3>
						<Palette
							value={pref.fallbackColour_dark}
							onChange={(value) =>
								(pref.fallbackColour_dark = value)
							}
						/>
					</div>
				</section>
				<section className={styles.cardSection}>
					<h3>{i18n.t("backupAndReset")}</h3>
					<button
						className={styles.textButton}
						onClick={() => {
							const data = pref.exportJSON();
							const blob = new Blob([data], {
								type: "application/json",
							});
							const url = URL.createObjectURL(blob);
							const a = document.createElement("a");
							a.href = url;
							a.download = "atbc_pref.json";
							a.click();
							URL.revokeObjectURL(url);
						}}
					>
						<Icon type="download" />
						<span>{i18n.t("exportSettings")}</span>
					</button>
					<button
						className={styles.textButton}
						onClick={() => fileInputRef.current?.click()}
					>
						<Icon type="upload" />
						<span>{i18n.t("importSettings")}</span>
					</button>
					<input
						type="file"
						accept="application/json"
						className="hidden"
						ref={fileInputRef}
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (!file) return;
							const reader = new FileReader();
							reader.onload = () => {
								const result = reader.result;
								if (typeof result !== "string") return;
								pref.importPref(result);
								e.target.value = "";
							};
							reader.readAsText(file);
						}}
					/>
					<Confirm
						confirmText={i18n.t("confirmResetAll")}
						onConfirm={() => pref.reset()}
					>
						{(open) => (
							<button
								className={styles.textButton}
								onClick={open}
							>
								<Icon type="reset" />
								<span>{i18n.t("resetAllSettings")}</span>
							</button>
						)}
					</Confirm>
				</section>
			</div>
		</main>
	);
}
