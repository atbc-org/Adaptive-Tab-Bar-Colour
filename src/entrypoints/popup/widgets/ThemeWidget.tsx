import styles from "./ThemeWidget.module.css";

interface ThemeWidgetProps {
	ready: boolean;
	pref: Prefs;
	scheme: Scheme;
}

export default function ThemeWidget({ ready, pref, scheme }: ThemeWidgetProps) {
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
							pref.advanced.compatibilityMode && "disabled",
						)}
						onMouseEnter={() => setHover("selectedTab")}
					>
						<h3>{i18n.t("selectedTab")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.theme.tabSelected}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.tabSelected = newValue;
								}}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.theme.tabSelectedBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.tabSelectedBorder = newValue;
								}}
							/>
						</div>
					</div>
					<div
						className={clsx(
							styles.panel,
							pref.advanced.compatibilityMode && "disabled",
						)}
						onMouseEnter={() => setHover("toolbar")}
					>
						<h3>{i18n.t("toolbar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.theme.toolbar}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.toolbar = newValue;
								}}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.theme.toolbarBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.toolbarBorder = newValue;
								}}
							/>
						</div>
					</div>
					<div
						className={clsx(
							styles.panel,
							pref.advanced.compatibilityMode && "disabled",
						)}
						onMouseEnter={() => setHover("sidebar")}
					>
						<h3>{i18n.t("sidebar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.theme.sidebar}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.sidebar = newValue;
								}}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.theme.sidebarBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.sidebarBorder = newValue;
								}}
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
							if (pref.advanced.compatibilityMode)
								setHover("none");
						}}
					>
						<h3>{i18n.t("tabBar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.theme.tabbar}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.tabbar = newValue;
								}}
							/>
						</div>
						<div
							className={clsx(
								pref.advanced.compatibilityMode && "disabled",
							)}
						>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.theme.tabbarBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.tabbarBorder = newValue;
								}}
							/>
						</div>
					</div>
					<div
						className={clsx(
							styles.panel,
							pref.advanced.compatibilityMode && "disabled",
						)}
						onMouseEnter={() => setHover("urlBar")}
					>
						<h3>{i18n.t("urlBar")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.theme.toolbarField}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.toolbarField = newValue;
								}}
							/>
						</div>
						<div>
							<Icon type="backgroundOnFocus" />
							<Slider
								inPopup
								value={pref.theme.toolbarFieldOnFocus}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.toolbarFieldOnFocus = newValue;
								}}
							/>
						</div>
						<div>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.theme.toolbarFieldBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.toolbarFieldBorder = newValue;
								}}
							/>
						</div>
					</div>
					<div
						className={styles.panel}
						onMouseEnter={() => setHover("popup")}
						onMouseLeave={() => {
							if (pref.advanced.compatibilityMode)
								setHover("none");
						}}
					>
						<h3>{i18n.t("popUp")}</h3>
						<div>
							<Icon type="background" />
							<Slider
								inPopup
								value={pref.theme.popup}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.popup = newValue;
								}}
							/>
						</div>
						<div
							className={clsx(
								pref.advanced.compatibilityMode && "disabled",
							)}
						>
							<Icon type="border" />
							<Slider
								inPopup
								value={pref.theme.popupBorder}
								leftIconType={leftIconType}
								rightIconType={rightIconType}
								onChange={(newValue) => {
									pref.theme.popupBorder = newValue;
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
