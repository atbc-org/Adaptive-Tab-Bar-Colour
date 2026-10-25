export default function App() {
	const [activeTab, setActiveTab] = useState(0);
	const { prefs, ready, updatePref } = usePrefs();

	useEffect(() => {
		document.documentElement.lang = browser.i18n.getUILanguage();
	}, []);

	return (
		<>
			<nav>
				<Toggle
					isTabToggle
					itemList={[
						i18n.t("themeBuilder"),
						i18n.t("ruleList"),
						i18n.t("advanced"),
					]}
					onChange={setActiveTab}
					activeIndex={activeTab}
				/>
			</nav>
			<hr />
			{(() => {
				switch (activeTab) {
					case 0:
						return (
							<ThemeTab
								prefs={prefs}
								ready={ready}
								updatePref={updatePref}
							/>
						);
					case 1:
						return <RuleTab prefs={prefs} ready={ready} />;
					case 2:
						return (
							<AdvancedTab
								prefs={prefs}
								ready={ready}
								updatePref={updatePref}
							/>
						);
					default:
						return null;
				}
			})()}
			<hr />
			<footer>
				<a
					href="https://github.com/atbc-org/Adaptive-Tab-Bar-Colour/issues"
					target="_blank"
					rel="noopener noreferrer"
				>
					{i18n.t("reportAnIssue")}
					<Icon type="redirect" inline size="text" />
				</a>
			</footer>
		</>
	);
}
