import AdvancedTab from "./tabs/AdvancedTab";
import RuleTab from "./tabs/RuleTab";
import ThemeTab from "./tabs/ThemeTab";

const pref = new Preference();

export default function App() {
	const [activeTab, setActiveTab] = useState(0);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		pref.initialise().then(() => {
			document.documentElement.classList.toggle("nova", pref.nova);
			setReady(true);
		});
		return pref.addOnChangeListener(() => {
			document.documentElement.classList.toggle("nova", pref.nova);
		});
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
						return <ThemeTab pref={pref} ready={ready} />;
					case 1:
						return <RuleTab pref={pref} ready={ready} />;
					case 2:
						return <AdvancedTab pref={pref} ready={ready} />;
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
