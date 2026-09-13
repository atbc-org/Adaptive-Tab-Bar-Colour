import clsx from "clsx";
import { useSyncExternalStore } from "react";
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
							pref.compatibilityMode && "disabled",
						)}
						onMouseEnter={() => setHover("selectedTab")}
					>
						<h3>{i18n.t("selectedTab")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.tabSelected}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									(pref.tabSelected = newValue)
								}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.tabSelectedBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									(pref.tabSelectedBorder = newValue)
								}
							/>
						</div>
					</div>
					<div
						className={clsx(
							styles.panel,
							pref.compatibilityMode && "disabled",
						)}
						onMouseEnter={() => setHover("toolbar")}
					>
						<h3>{i18n.t("toolbar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.toolbar}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									(pref.toolbar = newValue)
								}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.toolbarBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									(pref.toolbarBorder = newValue)
								}
							/>
						</div>
					</div>
					<div
						className={clsx(
							styles.panel,
							pref.compatibilityMode && "disabled",
						)}
						onMouseEnter={() => setHover("sidebar")}
					>
						<h3>{i18n.t("sidebar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.sidebar}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									(pref.sidebar = newValue)
								}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.sidebarBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									(pref.sidebarBorder = newValue)
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
						onMouseEnter={() =>
							setHover(pref.nova ? "frame" : "tabBar")
						}
						onMouseLeave={() => {
							if (pref.compatibilityMode) setHover("none");
						}}
					>
						<h3>
							{pref.nova ? i18n.t("frame") : i18n.t("tabBar")}
						</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.tabbar}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									(pref.tabbar = newValue)
								}
							/>
						</div>
						<div
							className={clsx(
								pref.compatibilityMode && "disabled",
							)}
						>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.tabbarBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									(pref.tabbarBorder = newValue)
								}
							/>
						</div>
					</div>
					<div
						className={clsx(
							styles.panel,
							pref.compatibilityMode && "disabled",
						)}
						onMouseEnter={() => setHover("urlBar")}
					>
						<h3>{i18n.t("urlBar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.toolbarField}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									(pref.toolbarField = newValue)
								}
							/>
						</div>
						<div>
							<Icon type="backgroundOnFocus" />
							<Slider
								inPopup
								value={pref.toolbarFieldOnFocus}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									(pref.toolbarFieldOnFocus = newValue)
								}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.toolbarFieldBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									(pref.toolbarFieldBorder = newValue)
								}
							/>
						</div>
					</div>
					<div
						className={styles.panel}
						onMouseEnter={() => setHover("popup")}
						onMouseLeave={() => {
							if (pref.compatibilityMode) setHover("none");
						}}
					>
						<h3>{i18n.t("popUp")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.popup}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => (pref.popup = newValue)}
							/>
						</div>
						<div
							className={clsx(
								pref.compatibilityMode && "disabled",
							)}
						>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.popupBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) =>
									(pref.popupBorder = newValue)
								}
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
