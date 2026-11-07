#!/bin/bash

set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Build JSON object containing all localised AMO descriptions
build_amo_descriptions() {
	local files=("$@")
	for file in "${files[@]}"; do
		local locale content
		locale=$(get_locale_from_readme "$file")
		content=$(convert_markdown_to_amo "$file")
		jq -n --arg loc "$locale" --arg content "$content" '{($loc): $content}'
	done | jq -s 'add'
}

# Write AMO synchronisation results table to GitHub Actions step summary
write_step_summary() {
	local skipped_str=" ${1:-} "
	shift || true

	{
		echo "### AMO Descriptions Synchronisation"
		echo ""
		echo "| Locale | Status | AMO Page |"
		echo "| :--- | :--- | :--- |"
		for file in "$@"; do
			local loc status="Synchronised" page
			loc=$(get_locale_from_readme "$file")
			page="[View](https://addons.mozilla.org/${loc}/firefox/addon/adaptive-tab-bar-colour/)"
			if [[ "$skipped_str" =~ [[:space:]]"${loc}"[[:space:]] ]]; then
				status="Skipped (unsupported)"
				page=""
			fi
			echo "| \`${loc}\` | ${status} | ${page} |"
		done
	} >>"$GITHUB_STEP_SUMMARY"
}

# Synchronise localised descriptions with Mozilla Add-ons API
sync_amo_descriptions() {
	shopt -s nullglob
	local files=(.github/README.md .github/README.*.md)
	[ ${#files[@]} -eq 0 ] && print_error "Error: No .github/README*.md files found."

	local token description skipped_locales=() response_file
	token=$(generate_amo_jwt)
	description=$(build_amo_descriptions "${files[@]}")
	response_file=$(mktemp)
	trap "rm -f '${response_file}'" EXIT

	while true; do
		local body http_code
		body=$(jq -n --argjson desc "$description" '{"description": $desc}')
		http_code=$(
			curl -s -o "$response_file" -w "%{http_code}" -X PATCH \
				--retry 3 --retry-connrefused --retry-delay 2 \
				"https://addons.mozilla.org/api/v5/addons/addon/adaptive-tab-bar-colour/" \
				-H "Authorization: JWT ${token}" \
				-H "Content-Type: application/json" \
				-d "$body"
		)

		[ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ] && break

		local invalid_locales
		invalid_locales=$(
			jq -r '.. | strings' "$response_file" 2>/dev/null |
				sed -n -E 's/.*The language code "([^"]+)".*/\1/p'
		)

		if [ -z "$invalid_locales" ]; then
			cat "$response_file" >&2
			print_error "Error: Failed to synchronise AMO descriptions (HTTP ${http_code})."
		fi

		for loc in $invalid_locales; do
			skipped_locales+=("$loc")
			description=$(jq --arg loc "$loc" 'del(.[$loc])' <<<"$description")
		done

		[ "$(jq 'keys | length' <<<"$description")" -eq 0 ] &&
			print_error "Error: No valid locales remaining to synchronise."
	done

	if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
		write_step_summary "${skipped_locales[*]:-}" "${files[@]}"
	fi

	print_success "Success: AMO descriptions synchronised."
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
	sync_amo_descriptions
fi
