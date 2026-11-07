/** Reads local preferences and provides reactive pref proxy. */
export default function usePrefs(): { pref: Prefs; ready: boolean } {
	const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		async function initialise(): Promise<void> {
			setPrefs(await getPrefs());
			setReady(true);
		}
		void initialise();
		return watchPrefs(setPrefs);
	}, []);

	const pref = useMemo(() => createPrefsProxy(prefs, setPrefs), [prefs]);
	return { pref, ready };
}
