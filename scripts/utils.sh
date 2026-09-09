#!/bin/bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
export PATH="$PWD/node_modules/.bin:$PATH"

# Run a command and output its logs only on error
run_cmd() {
	local output
	if ! output=$("$@" 2>&1); then
		echo "$output"
		return 1
	fi
}

# Print success message in green
print_success() {
	echo -e "\033[32m$1\033[0m"
}

# Print error message in red and exit 1
print_error() {
	echo -e "\033[31m$1\033[0m" >&2
	exit 1
}

# Get current version from package.json
get_package_version() {
	node -p "require('./package.json').version"
}

# Execute integration tests locally
execute_integration_tests() {
	bash scripts/zip.sh --clean
	npx tsx tests/run.ts --headless
}

# Configure git user identity for GitHub Actions bot
setup_git_author() {
	git config user.name "github-actions[bot]"
	git config user.email "github-actions[bot]@users.noreply.github.com"
}

# Tag repository with specified tag name and push to origin
git_tag_and_push() {
	local tag="$1"
	git tag "$tag"
	git push origin "$tag"
}

# Validate version string format (X.Y.Z)
validate_version_format() {
	local version="$1"
	if ! [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
		print_error "Error: Expects version format (X.Y.Z)."
	fi
}

# Add release branch, bump version, commit and push changes
add_release_branch() {
	local version="$1"
	validate_version_format "$version"
	local branch="release/v${version}"
	git checkout -b "$branch"
	npm version "$version" --no-git-tag-version
	setup_git_author
	git add package.json
	[ -f package-lock.json ] && git add package-lock.json
	git commit -m "chore: add release branch v${version}"
	git push origin "$branch"
}

# Compute next beta iteration and write outputs to GITHUB_OUTPUT
prepare_beta_version() {
	local base_version
	base_version=$(get_package_version)
	local iteration=1

	git fetch --tags --force --quiet 2>/dev/null || true
	local latest_beta
	latest_beta=$(
		git tag -l --sort=-v:refname "v${base_version}-beta.*" |
			head -n 1 || true
	)
	if [[ "$latest_beta" =~ \.([0-9]+)$ ]]; then
		iteration=$((BASH_REMATCH[1] + 1))
	fi

	local amo_version="${base_version}.${iteration}"
	local beta_tag="v${base_version}-beta.${iteration}"
	if [ -n "${GITHUB_OUTPUT:-}" ]; then
		echo "beta_version=${amo_version}" >>"$GITHUB_OUTPUT"
		echo "beta_tag=${beta_tag}" >>"$GITHUB_OUTPUT"
	fi
	echo "Prepared Beta Version: ${amo_version} (${beta_tag})"
}

# Build beta extension package and sign with web-ext
build_and_sign_beta() {
	local beta_version="$1"
	export EXT_VERSION="$beta_version"
	npx wxt build -b firefox --mode beta
	npx web-ext sign \
		--api-key "$FIREFOX_JWT_ISSUER" \
		--api-secret "$FIREFOX_JWT_SECRET" \
		--channel unlisted \
		--source-dir .output/atbc \
		--artifacts-dir .output \
		--approval-timeout 200000
}

# Tag release, locate and rename XPI asset, and create GitHub pre-release
create_beta_release() {
	local beta_tag="$1"
	local beta_version="$2"
	local xpi_asset
	xpi_asset=$(find .output -name "*.xpi" 2>/dev/null | head -n 1 || true)
	if [ -z "$xpi_asset" ]; then
		print_error "Error: Signed XPI asset not found in .output"
	fi
	local renamed_asset=".output/atbc-${beta_version}.xpi"
	mv "$xpi_asset" "$renamed_asset"

	git_tag_and_push "$beta_tag"
	gh release create "$beta_tag" "$renamed_asset" \
		--title "$beta_tag" \
		--prerelease
}

# Extract package version and create AMO metadata file
prepare_production_metadata() {
	local notes="$1"
	local base_version
	base_version=$(get_package_version)
	if [ -n "${GITHUB_OUTPUT:-}" ]; then
		echo "version=${base_version}" >>"$GITHUB_OUTPUT"
	fi
	mkdir -p .output
	jq -n \
		--arg notes "$notes" \
		'{"version": {"release_notes": {"en-GB": $notes}}}' \
		>.output/amo_metadata.json
}

# Build production extension package and sign with web-ext
build_and_sign_production() {
	bash scripts/zip.sh
	npx web-ext sign \
		--api-key "$FIREFOX_JWT_ISSUER" \
		--api-secret "$FIREFOX_JWT_SECRET" \
		--channel listed \
		--source-dir .output/atbc \
		--upload-source-code .output/atbc-sources.zip \
		--amo-metadata .output/amo_metadata.json \
		--approval-timeout 0
}

# Tag repository and create GitHub production release
create_production_release() {
	local version="$1"
	local notes="$2"
	local tag="v${version}"
	git_tag_and_push "$tag"
	gh release create "$tag" \
		--title "$tag" \
		--notes "$notes"
	git push origin --delete "release/${tag}" 2>/dev/null || true
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
	"$@"
fi
