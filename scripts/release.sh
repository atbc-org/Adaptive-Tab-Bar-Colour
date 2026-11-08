#!/bin/bash

set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Configure git user identity for GitHub Actions bot
setup_git_author() {
	git config user.name "github-actions[bot]"
	git config user.email "github-actions[bot]@users.noreply.github.com"
}

# Tag repository with specified tag name and push to origin
git_tag_and_push() {
	local tag="$1"
	git rev-parse -q --verify "refs/tags/$tag" >/dev/null || git tag "$tag"
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
	if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
		print_error "Error: Branch $branch already exists on origin."
	fi
	if git ls-remote --exit-code --tags origin "refs/tags/v${version}" >/dev/null 2>&1; then
		print_error "Error: Tag v${version} already exists on origin."
	fi
	git checkout -b "$branch"
	bun -e "const fs = require('fs'); const p = JSON.parse(fs.readFileSync('package.json', 'utf8')); p.version = process.argv[1]; fs.writeFileSync('package.json', JSON.stringify(p, null, '\t') + '\n');" "$version"
	bun install
	setup_git_author
	git add package.json
	[ -f bun.lock ] && git add bun.lock
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
	mkdir -p .output
	rm -f .output/*.xpi
	bunx wxt build -b firefox --mode beta
	bunx web-ext sign \
		--api-key "$FIREFOX_JWT_ISSUER" \
		--api-secret "$FIREFOX_JWT_SECRET" \
		--channel unlisted \
		--source-dir .output/atbc \
		--artifacts-dir .output \
		--approval-timeout 300000 || true
}

# Tag release, locate and rename XPI asset, and create GitHub pre-release
create_beta_release() {
	local beta_tag="$1"
	local beta_version="$2"
	local xpi_asset
	xpi_asset=$(find .output -name "*.xpi" 2>/dev/null | head -n 1 || true)
	if [ -n "$xpi_asset" ] && ! unzip -tq "$xpi_asset" >/dev/null 2>&1; then
		rm -f "$xpi_asset"
		xpi_asset=""
	fi
	git_tag_and_push "$beta_tag"

	if [ -z "$xpi_asset" ]; then
		gh release view "$beta_tag" >/dev/null 2>&1 ||
			gh release create "$beta_tag" \
				--verify-tag \
				--title "$beta_tag" \
				--notes "Build is waiting for approval on AMO." \
				--prerelease
	else
		local renamed_asset=".output/atbc-${beta_version}.xpi"
		[ "$xpi_asset" != "$renamed_asset" ] && mv "$xpi_asset" "$renamed_asset"
		if gh release view "$beta_tag" >/dev/null 2>&1; then
			gh release upload "$beta_tag" "$renamed_asset" --clobber
		else
			gh release create "$beta_tag" "$renamed_asset" \
				--verify-tag \
				--title "$beta_tag" \
				--prerelease
		fi
	fi
}

# Build production extension package and sign with web-ext
build_and_sign_production() {
	local notes="${1:-}"
	bash scripts/zip.sh

	local metadata_file
	metadata_file=$(mktemp)
	trap "rm -f '$metadata_file'" EXIT
	jq -n \
		--arg notes "$notes" \
		'{"version": {"release_notes": {"en-GB": $notes}}}' \
		>"$metadata_file"

	bunx web-ext sign \
		--api-key "$FIREFOX_JWT_ISSUER" \
		--api-secret "$FIREFOX_JWT_SECRET" \
		--channel listed \
		--source-dir .output/atbc \
		--upload-source-code .output/atbc-sources.zip \
		--amo-metadata "$metadata_file" \
		--approval-timeout 0 ||
		print_warning "Warning: AMO submission did not complete cleanly; proceeding with GitHub release."
}

# Tag repository and create GitHub production release
create_production_release() {
	local version notes
	if [ $# -ge 2 ]; then
		version="$1"
		notes="$2"
	else
		version=$(get_package_version)
		notes="${1:-}"
	fi
	local tag="v${version}"
	git_tag_and_push "$tag"
	gh release view "$tag" >/dev/null 2>&1 ||
		gh release create "$tag" \
			--verify-tag \
			--title "$tag" \
			--notes "$notes"
	git push origin --delete "release/${tag}" 2>/dev/null || true
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
	"$@"
fi
