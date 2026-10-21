import styles from "./ThemeWidget.module.css";

interface ThemeWidgetProps {
	ready: boolean;
	pref: Preference;
	scheme: Scheme;
}

export default function ThemeWidget({ ready, pref, scheme }: ThemeWidgetProps) {
	useSyncExternalStore(
		(listener) => pref.addOnChangeListener(listener),
		() => pref.getLastSave(),
	);

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
							pref.get("compatibilityMode") && "disabled",
						)}
						onMouseEnter={() => setHover("selectedTab")}
					>
						<h3>{i18n.t("selectedTab")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.get("tabSelected")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("tabSelected", newValue)
								}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.get("tabSelectedBorder")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("tabSelectedBorder", newValue)
								}
							/>
						</div>
					</div>
					<div
						className={clsx(
							styles.panel,
							pref.get("compatibilityMode") && "disabled",
						)}
						onMouseEnter={() => setHover("toolbar")}
					>
						<h3>{i18n.t("toolbar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.get("toolbar")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("toolbar", newValue)
								}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.get("toolbarBorder")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("toolbarBorder", newValue)
								}
							/>
						</div>
					</div>
					<div
						className={clsx(
							styles.panel,
							pref.get("compatibilityMode") && "disabled",
						)}
						onMouseEnter={() => setHover("sidebar")}
					>
						<h3>{i18n.t("sidebar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.get("sidebar")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("sidebar", newValue)
								}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.get("sidebarBorder")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("sidebarBorder", newValue)
								}
							/>
						</div>
					</div>
					<button
						className={styles.moreSettingsButton}
						onMouseEnter={() => setHover("none")}
						onClick={() => browser.runtime.openOptionsPage()}
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
							if (pref.get("compatibilityMode")) setHover("none");
						}}
					>
						<h3>{i18n.t("tabBar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.get("tabbar")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("tabbar", newValue)
								}
							/>
						</div>
						<div
							className={clsx(
								pref.get("compatibilityMode") && "disabled",
							)}
						>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.get("tabbarBorder")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("tabbarBorder", newValue)
								}
							/>
						</div>
					</div>
					<div
						className={clsx(
							styles.panel,
							pref.get("compatibilityMode") && "disabled",
						)}
						onMouseEnter={() => setHover("urlBar")}
					>
						<h3>{i18n.t("urlBar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.get("toolbarField")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("toolbarField", newValue)
								}
							/>
						</div>
						<div>
							<Icon type="backgroundOnFocus" />
							<Slider
								inPopup
								value={pref.get("toolbarFieldOnFocus")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("toolbarFieldOnFocus", newValue)
								}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.get("toolbarFieldBorder")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("toolbarFieldBorder", newValue)
								}
							/>
						</div>
					</div>
					<div
						className={styles.panel}
						onMouseEnter={() => setHover("popup")}
						onMouseLeave={() => {
							if (pref.get("compatibilityMode")) setHover("none");
						}}
					>
						<h3>{i18n.t("popUp")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.get("popup")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("popup", newValue)
								}
							/>
						</div>
						<div
							className={clsx(
								pref.get("compatibilityMode") && "disabled",
							)}
						>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.get("popupBorder")}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									pref.set("popupBorder", newValue)
								}
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
