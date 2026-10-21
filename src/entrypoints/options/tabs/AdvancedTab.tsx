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
	const [isSyncPending, setIsSyncPending] = useState(false);
	const [syncFailed, setSyncFailed] = useState(false);

	const changeSync = async (
		enabled: boolean,
		choice?: SettingsSyncChoice,
		onConflict?: () => void,
	) => {
		setIsSyncPending(true);
		setSyncFailed(false);
		try {
			if (!(await pref.flush()))
				throw new Error("Local settings could not be saved");
			const result = await sendMessageToBackground<SettingsSyncResult>({
				header: "SETTINGS_SYNC",
				enabled,
				choice,
			});
			if (result.status === "conflict") onConflict?.();
			if (result.status === "error") setSyncFailed(true);
		} catch {
			setSyncFailed(true);
		} finally {
			setIsSyncPending(false);
		}
	};

	return (
		<main className={clsx(styles.advancedTab, !ready && "disabled")}>
			<div className={styles.column}>
				<section
					className={styles.cardSection}
					aria-labelledby="advanced-colour-selection"
				>
					<h2 id="advanced-colour-selection">
						{i18n.t("colourSelection")}
					</h2>
					<div className={styles.settingGroup}>
						<div className={styles.switchWrapper}>
							<Switch
								label={i18n.t("dynamicColourUpdate")}
								active={pref.get("dynamic")}
								onChange={(value) => pref.set("dynamic", value)}
							/>
							<div>
								<h3>{i18n.t("dynamicColourUpdate")}</h3>
								<p>{i18n.t("dynamicModeTooltip")}</p>
							</div>
						</div>
					</div>
					<div className={styles.settingGroup}>
						<div className={styles.switchWrapper}>
							<Switch
								label={i18n.t("ignoreDesignatedThemeColour")}
								active={pref.get("noThemeColour")}
								onChange={(value) =>
									pref.set("noThemeColour", value)
								}
							/>
							<div>
								<h3>{i18n.t("ignoreDesignatedThemeColour")}</h3>
								<p>
									{i18n.t(
										"ignoreDesignatedThemeColourTooltip",
									)}
								</p>
							</div>
						</div>
					</div>
				</section>
				<section
					className={clsx(
						styles.cardSection,
						pref.get("compatibilityMode") && "disabled",
					)}
					aria-labelledby="advanced-custom-colours"
				>
					<h2 id="advanced-custom-colours">
						{i18n.t("customColours")}
					</h2>
					<fieldset
						className={styles.cardContent}
						disabled={pref.get("compatibilityMode")}
					>
						<div className={styles.settingGroup}>
							<h3>{i18n.t("homepageColour")}</h3>
							<p>{i18n.t("homepageColourTooltip")}</p>
							<div className={styles.colourWrapper}>
								<div>
									<Palette
										value={pref.get("homeBackground_light")}
										onChange={(value) =>
											pref.set(
												"homeBackground_light",
												value,
											)
										}
									/>
									<h4>
										{i18n.t("inLightMode")}
										<button
											className={styles.resetButton}
											title={i18n.t("reset")}
											onClick={() => {
												pref.reset([
													"homeBackground_light",
												]);
											}}
										>
											<Icon type="reset" size="text" />
										</button>
									</h4>
								</div>
								<div>
									<Palette
										value={pref.get("homeBackground_dark")}
										onChange={(value) =>
											pref.set(
												"homeBackground_dark",
												value,
											)
										}
									/>
									<h4>
										{i18n.t("inDarkMode")}
										<button
											className={styles.resetButton}
											title={i18n.t("reset")}
											onClick={() => {
												pref.reset([
													"homeBackground_dark",
												]);
											}}
										>
											<Icon type="reset" size="text" />
										</button>
									</h4>
								</div>
							</div>
						</div>
						<div className={styles.settingGroup}>
							<h3>{i18n.t("fallbackColour")}</h3>
							<p>{i18n.t("fallbackColourTooltip")}</p>
							<div className={styles.colourWrapper}>
								<div>
									<Palette
										value={pref.get("fallbackColour_light")}
										onChange={(value) =>
											pref.set(
												"fallbackColour_light",
												value,
											)
										}
									/>
									<h4>
										{i18n.t("inLightMode")}
										<button
											className={styles.resetButton}
											title={i18n.t("reset")}
											onClick={() => {
												pref.reset([
													"fallbackColour_light",
												]);
											}}
										>
											<Icon type="reset" size="text" />
										</button>
									</h4>
								</div>
								<div>
									<Palette
										value={pref.get("fallbackColour_dark")}
										onChange={(value) =>
											pref.set(
												"fallbackColour_dark",
												value,
											)
										}
									/>
									<h4>
										{i18n.t("inDarkMode")}
										<button
											className={styles.resetButton}
											title={i18n.t("reset")}
											onClick={() => {
												pref.reset([
													"fallbackColour_dark",
												]);
											}}
										>
											<Icon type="reset" size="text" />
										</button>
									</h4>
								</div>
							</div>
						</div>
						<div className={styles.settingGroup}>
							<div className={styles.switchWrapper}>
								<Switch
									label={i18n.t("overwriteAccentColour")}
									active={pref.get("overwriteAccentColour")}
									onChange={(value) => {
										pref.reset(["accentColour_light"]);
										pref.reset(["accentColour_dark"]);
										pref.set(
											"overwriteAccentColour",
											value,
										);
									}}
								/>
								<div>
									<h3>{i18n.t("overwriteAccentColour")}</h3>
									<p>
										{i18n.t("overwriteAccentColourTooltip")}
									</p>
								</div>
							</div>
							{pref.get("overwriteAccentColour") && (
								<div className={styles.colourWrapper}>
									<div>
										<Palette
											value={pref.get(
												"accentColour_light",
											)}
											onChange={(value) =>
												pref.set(
													"accentColour_light",
													value,
												)
											}
										/>
										<h4>
											{i18n.t("inLightMode")}
											<button
												className={styles.resetButton}
												title={i18n.t("reset")}
												onClick={() => {
													pref.reset([
														"accentColour_light",
													]);
												}}
											>
												<Icon
													type="reset"
													size="text"
												/>
											</button>
										</h4>
									</div>
									<div>
										<Palette
											value={pref.get(
												"accentColour_dark",
											)}
											onChange={(value) =>
												pref.set(
													"accentColour_dark",
													value,
												)
											}
										/>
										<h4>
											{i18n.t("inDarkMode")}
											<button
												className={styles.resetButton}
												title={i18n.t("reset")}
												onClick={() => {
													pref.reset([
														"accentColour_dark",
													]);
												}}
											>
												<Icon
													type="reset"
													size="text"
												/>
											</button>
										</h4>
									</div>
								</div>
							)}
						</div>
					</fieldset>
				</section>
			</div>
			<div className={styles.column}>
				<section
					className={styles.cardSection}
					aria-labelledby="advanced-accessibility"
				>
					<h2 id="advanced-accessibility">
						{i18n.t("accessibility")}
					</h2>
					<fieldset
						className={clsx(
							styles.settingGroup,
							pref.get("compatibilityMode") && "disabled",
						)}
						disabled={pref.get("compatibilityMode")}
					>
						<div className={styles.switchWrapper}>
							<Switch
								label={i18n.t(
									scheme === "light"
										? "allowDarkTabBar"
										: "allowLightTabBar",
								)}
								active={pref.get("allowDarkLight")}
								onChange={(value) =>
									pref.set("allowDarkLight", value)
								}
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
						</div>
					</fieldset>
					<div className={styles.settingGroup}>
						<h3>{i18n.t("minimumContrast")}</h3>
						<p>{i18n.t("minimumContrastTooltip")}</p>
						<div className={styles.sliderWrapper}>
							<Slider
								minValue={0}
								maxValue={210}
								minorStep={5}
								majorStep={15}
								value={pref.get("minContrast_light")}
								leftIconType="circle"
								rightIconType="contrast"
								onDisplay={(value) => (value / 10).toFixed(1)}
								onChange={(value) =>
									pref.set("minContrast_light", value)
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
								value={pref.get("minContrast_dark")}
								leftIconType="circle"
								rightIconType="contrast"
								onDisplay={(value) => (value / 10).toFixed(1)}
								onChange={(value) =>
									pref.set("minContrast_dark", value)
								}
							/>
							<h4>{i18n.t("inDarkMode")}</h4>
						</div>
					</div>
				</section>
				<section
					className={styles.cardSection}
					aria-labelledby="advanced-compatibility"
				>
					<h2 id="advanced-compatibility">
						{i18n.t("browserIntegration")}
					</h2>
					<div className={styles.settingGroup}>
						<div className={styles.switchWrapper}>
							<Switch
								label={i18n.t("compatibilityMode")}
								active={pref.get("compatibilityMode")}
								onChange={(value) =>
									pref.set("compatibilityMode", value)
								}
							/>
							<div>
								<h3>{i18n.t("compatibilityMode")}</h3>
								<p>{i18n.t("compatibilityModeTooltip")}</p>
							</div>
						</div>
					</div>
				</section>
				<section
					className={styles.cardSection}
					aria-labelledby="advanced-backup"
				>
					<h2 id="advanced-backup">{i18n.t("backupAndReset")}</h2>
					<div
						className={styles.settingGroup}
						aria-busy={isSyncPending}
					>
						<Confirm
							confirmText={i18n.t("confirmSyncSettings")}
							confirmLabel={i18n.t("keepLocalSettings")}
							cancelLabel={i18n.t("keepCloudSettings")}
							onConfirm={() => void changeSync(true, "local")}
							onCancel={() => void changeSync(true, "cloud")}
						>
							{(open) => (
								<div className={styles.switchWrapper}>
									<Switch
										label={i18n.t("syncSettings")}
										active={pref.get("syncSettings")}
										disabled={isSyncPending}
										onChange={(value) =>
											void changeSync(
												value,
												undefined,
												open,
											)
										}
									/>
									<div>
										<h3>{i18n.t("syncSettings")}</h3>
										<p>{i18n.t("syncSettingsTooltip")}</p>
									</div>
								</div>
							)}
						</Confirm>
						{syncFailed && (
							<p role="alert">{i18n.t("syncSettingsFailed")}</p>
						)}
					</div>

					<div className={styles.settingGroup}>
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
					</div>
				</section>
			</div>
		</main>
	);
}
