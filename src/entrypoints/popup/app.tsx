async function getCache(): Promise<CacheData | undefined> {
	return await sendMessageToBackground<CacheData | undefined>({
		header: "CACHE_REQUEST",
	});
}

export default function App() {
	const { pref, ready } = usePrefs();
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
		getCache().then(async (newCache) => {
			const windowId = await getActiveWindowId();
			windowIdRef.current = windowId;
			if (windowId !== undefined) setCache(newCache);
		});
		addMessageListener(handleMessage);
		return () => {
			removeMessageListener(handleMessage);
		};
	}, []);

	const popupColour = cache?.setThemeResult?.theme?.colors?.popup;

	useEffect(() => {
		if (typeof popupColour === "string")
			document.documentElement.style.setProperty("--app", popupColour);
	}, [popupColour]);

	return (
		<>
			{ready && cache ? (
				<>
					<RuleWidget
						pref={pref}
						getRuleResult={cache.getRuleResult}
						getMetaResult={cache.getMetaResult}
					/>
					{cache.setThemeResult.corrected && <CorrectionWidget />}
				</>
			) : (
				<LoadingWidget />
			)}
			<ThemeWidget
				ready={ready}
				pref={pref}
				scheme={cache?.setThemeResult?.scheme ?? currentScheme}
			/>
		</>
	);
}
