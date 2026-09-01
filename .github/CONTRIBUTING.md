# Contributing

Thank you for your interest in contributing to Adaptive Tab Bar Colour!

## Sponsor

One way to contribute to the project is through sponsorship via:

<a href="https://www.paypal.com/donate?hosted_button_id=T5GL8WC7SVLLC" target="_blank">
	<img
		src="https://www.paypalobjects.com/en_US/DK/i/btn/btn_donateCC_LG.gif"
		alt="Donate with PayPal button"
		style="height: 30px !important; width: auto !important"
	/>
</a>
<a href="https://www.buymeacoffee.com/easonwong" target="_blank">
	<img
		src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
		alt="Buy Me A Coffee"
		style="height: 30px !important; width: auto !important"
	/>
</a>

## Translation

To fix translation errors or add a new locale, please update the following files:

- `src/locales/xx.yaml`: The text in the add-on’s popup and options page.
- `amo/amo-xx.md`: The add-on description on the Mozilla Add-on store and the “Details” section in Firefox’s Add-ons Manager.

You can work on the locales using the [i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) extension.

## Development

Ensure the following software is installed:

- [Node.js](https://nodejs.org/) (v20 or higher)
- [Firefox](https://www.firefox.com/) or [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/)

To begin contributing, run the following commands:

```bash
git clone https://github.com/atbc-org/Adaptive-Tab-Bar-Colour.git
cd Adaptive-Tab-Bar-Colour
npm install
```

To test the changes with Firefox, run `npm start`. Alternatively, run `npm run start:dev` to test with Firefox Developer Edition. The add-on will be built and launch in the browser.
