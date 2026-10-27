/** Reads local preferences and writes updates to storage. */
export default function usePrefs(): {
	prefs: Prefs;
	ready: boolean;
	updatePref: typeof setPref;
} {
	const [prefs, setPrefs] = useState<Prefs>({ ...defaultPrefs, rules: {} });
	const [ready, setReady] = useState(false);

	useEffect(() => {
		getPrefs().then((initial) => {
			setPrefs(initial);
			setReady(true);
		});
		return watchPrefs(setPrefs);
	}, []);

	return { prefs, ready, updatePref: setPref };
}
