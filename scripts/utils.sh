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

# Print warning message in yellow
print_warning() {
	echo -e "\033[33m$1\033[0m" >&2
}

# Print error message in red and exit 1
print_error() {
	echo -e "\033[31m$1\033[0m" >&2
	exit 1
}

# Encode standard input to URL-safe base64
base64url() {
	openssl base64 -e -A | tr "+/" "-_" | tr -d "=\n"
}

# Get current version from package.json
get_package_version() {
	bun -e "console.log(require('./package.json').version)"
}

# Execute integration tests locally
execute_integration_tests() {
	bash scripts/zip.sh --clean
	bun run test:headless
}

# Extract locale identifier from a README file path
get_locale_from_readme() {
	local file="$1"
	if [ "$file" = ".github/README.md" ] || [ "$file" = "README.md" ]; then
		echo "en-GB"
	else
		local filename
		filename=$(basename "$file")
		local locale="${filename#README.}"
		echo "${locale%.md}"
	fi
}

# Convert Markdown documentation into AMO description format
convert_markdown_to_amo() {
	local input_file="$1"

	awk '
	function flush_group(depth, lines, count,    p, i) {
		p = ">"
		for (i = 0; i < depth; i++) p = p " >"
		p = p " "
		print p "```"
		for (i = 1; i <= count; i++) print p lines[i]
		print p "```\n"
	}

	function process_code_line(line,    d, text) {
		if (line ~ /^[ \t]*$/) return
		match(line, /^\t*/)
		d = RLENGTH
		text = substr(line, d + 1)

		if (d != cur_depth && num_lines > 0) {
			flush_group(cur_depth, group_lines, num_lines)
			num_lines = 0
		}
		cur_depth = d
		group_lines[++num_lines] = text
	}

	# Filter out ignored sections and prettier comments
	/<!-- amo-ignore-start -->/ { in_ignore = 1; next }
	/<!-- amo-ignore-end -->/   { in_ignore = 0; next }
	in_ignore || /<!-- prettier-ignore/ { next }

	# Convert Markdown headings (##) to bold (**)
	sub(/^##+ /, "") {
		print "**" $0 "**"
		next
	}

	# Stream and format code blocks
	/^```/ {
		if (!in_code) {
			in_code = 1
			cur_depth = -1
			num_lines = 0
		} else {
			in_code = 0
			if (num_lines > 0) {
				flush_group(cur_depth, group_lines, num_lines)
				num_lines = 0
			}
		}
		next
	}

	in_code {
		process_code_line($0)
		next
	}

	{ print $0 }
	' "$input_file" | cat -s
}

# Generate a JWT for Firefox Add-ons API authentication
generate_amo_jwt() {
	local issuer="${1:-${FIREFOX_JWT_ISSUER:-}}"
	local secret="${2:-${FIREFOX_JWT_SECRET:-}}"
	[ -z "$issuer" ] && print_error "Error: FIREFOX_JWT_ISSUER is required."
	[ -z "$secret" ] && print_error "Error: FIREFOX_JWT_SECRET is required."

	local header issued_at expires_at nonce payload signature

	header=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64url)
	issued_at=$(date +%s)
	expires_at=$((issued_at + 300))
	nonce=$(openssl rand -hex 16)

	payload=$(
		printf '{"iss":"%s","jti":"%s","iat":%d,"exp":%d}' \
			"$issuer" \
			"$nonce" \
			"$issued_at" \
			"$expires_at" |
			base64url
	)

	signature=$(
		echo -n "${header}.${payload}" |
			openssl dgst -sha256 -hmac "$secret" -binary |
			base64url
	)

	echo "${header}.${payload}.${signature}"
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
	"$@"
fi
