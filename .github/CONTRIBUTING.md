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

## Release Workflow

`main` always reflects the current production release. New work and stabilisation happen on dedicated `release/vX.Y.Z` branches.

```mermaid
flowchart TD
    main10["main: v1.0.0 (Production)"]

    main10 --> Development

    subgraph Development["Development"]
        direction LR
        subgraph DevPath["Feature & Beta Track"]
            direction TB
            start["1. Run 'Start Version' on main (e.g. 1.1.0)"] --> add["Add branch release/v1.1.0<br/>(package.json is 1.1.0)"]
            add --> feat["Merge feature/* & fix/* into release/v1.1.0"]
            feat --> beta["Run 'Release Beta' on release/v1.1.0<br/>• Auto-AMO: 1.1.0.1, 1.1.0.2...<br/>• Auto-Tag: v1.1.0-beta.N"]
        end

        subgraph ChorePath["Chore Track"]
            direction TB
            cstart["Branch chore/* from main"] --> cdev["Dependabot, docs, tooling updates"]
            cdev --> cpr["Merge chore/* -> main"]
        end
    end

    Development --> Production

    subgraph Production["Production"]
        direction TB
        pr["Open PR: release/v1.1.0 -> main<br/>(PR body contains release notes)"]
        pr --> auto_prod["'Release Production' triggers automatically on merge<br/>• Upload 1.1.0 to AMO Listed<br/>• Tag v1.1.0 + GitHub Release<br/>• Delete release/v1.1.0"]
    end

    Production --> main11["main: v1.1.0 (Production)"]
```

### Workflow Rules

1. **Features & Fixes**: Branch from and open PRs targeting the active `release/vX.Y.Z`. PRs merge once integration tests pass.
2. **Beta Testing**: The `Release Beta` workflow runs on `release/**` branches to deploy test builds (`X.Y.Z.1`, `X.Y.Z.2`...) to AMO (unlisted) and tag GitHub pre-releases (`vX.Y.Z-beta.N`).
3. **Production Releases**: Open a PR from `release/vX.Y.Z` to `main`. The PR body serves as release notes. Merging into `main` automatically triggers `Release Production`, which uploads to AMO (listed), tags `vX.Y.Z`, creates the GitHub Release, and deletes the release branch.
4. **Chores**: Maintenance branches (`chore/*`, Dependabot updates, documentation) branch from and merge directly into `main`.
