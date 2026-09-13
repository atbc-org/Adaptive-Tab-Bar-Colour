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

# Encode standard input to URL-safe base64
base64url() {
	openssl base64 -e -A | tr "+/" "-_" | tr -d "=\n"
}

# Get current version from package.json
get_package_version() {
	node -p "require('./package.json').version"
}

# Execute integration tests locally
execute_integration_tests() {
	bash scripts/zip.sh --clean
	npm run test:headless
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
	"$@"
fi
