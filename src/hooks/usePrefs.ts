/**
 * A custom React hook that loads and synchronises extension prefs via WXT
 * Storage.
 */
export default function usePrefs(): {
	prefs: Prefs;
	ready: boolean;
	updatePref: <K extends keyof ThemePrefs | keyof AdvancedPrefs>(
		key: K,
		value: Prefs[K],
	) => void;
} {
	const [prefs, setPrefs] = useState<Prefs>({ ...defaultPrefs });
	const [ready, setReady] = useState(false);

	useEffect(() => {
		getPrefs().then((initial) => {
			setPrefs(initial);
			setReady(true);
		});
		return watchPrefs(setPrefs);
	}, []);

	const updatePref = useCallback(
		<K extends keyof ThemePrefs | keyof AdvancedPrefs>(
			key: K,
			value: Prefs[K],
		) => {
			const normalised = normalisePref(key, value);
			setPrefs((prev) => ({ ...prev, [key]: normalised }));
			void setPref(key, normalised);
		},
		[],
	);

	return { prefs, ready, updatePref };
}
