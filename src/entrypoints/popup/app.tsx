import CorrectionWidget from "./widgets/CorrectionWidget";
import LoadingWidget from "./widgets/LoadingWidget";
import RuleWidget from "./widgets/RuleWidget";
import ThemeWidget from "./widgets/ThemeWidget";

const pref = new Preference();

async function getCache(): Promise<CacheData | undefined> {
	return await sendMessageToBackground<CacheData | undefined>({
		header: "CACHE_REQUEST",
	});
}

export default function App() {
	const [ready, setReady] = useState(false);
	const [cache, setCache] = useState<CacheData | undefined>();
	const windowIdRef = useRef<number | undefined>(0);
	const currentScheme = useCurrentScheme();

	function handleMessage(message: MessageForPopup): void {
		if (
			message.header === "CACHE_UPDATE" &&
			message.windowId === windowIdRef.current
		)
			setCache(message.cache);
	}

	useEffect(() => {
		pref.initialise().then(() => {
			document.documentElement.classList.toggle("nova", pref.nova);
			setReady(true);
		});
		getCache().then(async (newCache) => {
			const windowId = await getActiveWindowId();
			windowIdRef.current = windowId;
			if (windowId !== undefined) setCache(newCache);
		});
		addMessageListener(handleMessage);
		const removePrefListener = pref.addOnChangeListener(() => {
			document.documentElement.classList.toggle("nova", pref.nova);
		});
		return () => {
			removeMessageListener(handleMessage);
			removePrefListener();
		};
	}, []);

	useEffect(() => {
		const colour = cache?.themeData?.popupColour;
		if (colour) document.documentElement.style.setProperty("--app", colour);
	}, [cache?.themeData?.popupColour]);

	return (
		<>
			{ready && cache ? (
				<>
					<RuleWidget
						pref={pref}
						ruleData={cache.ruleData}
						metaData={cache.metaData}
					/>
					{cache.themeData.corrected && <CorrectionWidget />}
				</>
			) : (
				<LoadingWidget />
			)}
			<ThemeWidget
				ready={ready}
				pref={pref}
				scheme={cache?.themeData?.scheme ?? currentScheme}
			/>
		</>
	);
}
