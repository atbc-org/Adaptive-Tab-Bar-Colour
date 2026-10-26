import styles from "./ThemeWidget.module.css";

interface ThemeWidgetProps {
	ready: boolean;
	prefs: Prefs;
	updatePref: <K extends keyof ThemePrefs | keyof AdvancedPrefs>(
		key: K,
		value: Prefs[K],
	) => void;
	scheme: Scheme;
}

export default function ThemeWidget({
	ready,
	prefs,
	updatePref,
	scheme,
}: ThemeWidgetProps) {
	const [hover, setHover] = useState<GlyphHighlight>("none");

	const leftIconType = scheme === "light" ? "sun" : "moon";
	const rightIconType = scheme === "light" ? "moon" : "sun";

	return (
		<section className={clsx(styles.themeWidget, !ready && "disabled")}>
			<h2>{i18n.t("themeBuilder")}</h2>
			<div className={styles.glyphWrapper}>
				<Glyph highlight={hover} scale={1.25} />
				<div>
					<p>
						<Icon type="background" inline size="small" />
						<span>{i18n.t("background")}</span>
					</p>
					<p>
						<Icon type="backgroundOnFocus" inline size="small" />
						<span>{i18n.t("backgroundOnFocus")}</span>
					</p>

					<p>
						<Icon type="border" inline size="small" />
						<span>{i18n.t("border")}</span>
					</p>
				</div>
			</div>
			<hr />
			<div
				className={styles.panelWrapper}
				onMouseLeave={() => setHover("none")}
			>
				<div>
					<div
						className={clsx(
							styles.panel,
							prefs.compatibilityMode && "disabled",
						)}
						onMouseEnter={() => setHover("selectedTab")}
					>
						<h3>{i18n.t("selectedTab")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={prefs.tabSelected}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("tabSelected", newValue)
								}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={prefs.tabSelectedBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("tabSelectedBorder", newValue)
								}
							/>
						</div>
					</div>
					<div
						className={clsx(
							styles.panel,
							prefs.compatibilityMode && "disabled",
						)}
						onMouseEnter={() => setHover("toolbar")}
					>
						<h3>{i18n.t("toolbar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={prefs.toolbar}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("toolbar", newValue)
								}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={prefs.toolbarBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("toolbarBorder", newValue)
								}
							/>
						</div>
					</div>
					<div
						className={clsx(
							styles.panel,
							prefs.compatibilityMode && "disabled",
						)}
						onMouseEnter={() => setHover("sidebar")}
					>
						<h3>{i18n.t("sidebar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={prefs.sidebar}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("sidebar", newValue)
								}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={prefs.sidebarBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("sidebarBorder", newValue)
								}
							/>
						</div>
					</div>
					<button
						className={styles.moreSettingsButton}
						onMouseEnter={() => setHover("none")}
						onClick={() => void openOptionsPage()}
					>
						<span>{i18n.t("moreSettings")}</span>
						<Icon type="redirect" inline size="text" />
					</button>
				</div>
				<div>
					<div
						className={styles.panel}
						onMouseEnter={() => setHover("tabBar")}
						onMouseLeave={() => {
							if (prefs.compatibilityMode) setHover("none");
						}}
					>
						<h3>{i18n.t("tabBar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={prefs.tabbar}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("tabbar", newValue)
								}
							/>
						</div>
						<div
							className={clsx(
								prefs.compatibilityMode && "disabled",
							)}
						>
							<Icon type="border" />
							<Slider
								inPopup
								value={prefs.tabbarBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("tabbarBorder", newValue)
								}
							/>
						</div>
					</div>
					<div
						className={clsx(
							styles.panel,
							prefs.compatibilityMode && "disabled",
						)}
						onMouseEnter={() => setHover("urlBar")}
					>
						<h3>{i18n.t("urlBar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={prefs.toolbarField}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("toolbarField", newValue)
								}
							/>
						</div>
						<div>
							<Icon type="backgroundOnFocus" />
							<Slider
								inPopup
								value={prefs.toolbarFieldOnFocus}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("toolbarFieldOnFocus", newValue)
								}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={prefs.toolbarFieldBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("toolbarFieldBorder", newValue)
								}
							/>
						</div>
					</div>
					<div
						className={styles.panel}
						onMouseEnter={() => setHover("popup")}
						onMouseLeave={() => {
							if (prefs.compatibilityMode) setHover("none");
						}}
					>
						<h3>{i18n.t("popUp")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={prefs.popup}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("popup", newValue)
								}
							/>
						</div>
						<div
							className={clsx(
								prefs.compatibilityMode && "disabled",
							)}
						>
							<Icon type="border" />
							<Slider
								inPopup
								value={prefs.popupBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									updatePref("popupBorder", newValue)
								}
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
