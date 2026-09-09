#!/bin/bash

set -euo pipefail
source "$(dirname "$0")/utils.sh"

cd "$(dirname "$0")/.."
mkdir -p .output
rm -rf .output/*

if [ "${1:-}" == "--clean" ]; then
	echo "Zipping extension without source..."
	run_cmd wxt zip -b firefox --no-sources
	rm -rf .output/atbc
	print_success "Success: Extension zip is ready."
	exit 0
elif [ -z "${1:-}" ]; then
	echo "Zipping extension..."
	run_cmd wxt zip -b firefox

	BUILD_DIR=".output/atbc"
	SOURCES_ZIP=".output/atbc-sources.zip"
	if [ ! -d "$BUILD_DIR" ]; then
		print_error "Error: Extension build not found at $BUILD_DIR"
	fi
	if [ ! -f "$SOURCES_ZIP" ]; then
		print_error "Error: Sources zip not found at $SOURCES_ZIP"
	fi

	echo "Validating sources zip..."

	SOURCES_DIR=$(mktemp -d)
	trap 'rm -rf "$SOURCES_DIR"' EXIT
	mkdir -p "$SOURCES_DIR"
	unzip -q "$SOURCES_ZIP" -d "$SOURCES_DIR"

	(
		cd "$SOURCES_DIR"
		run_cmd npm install --no-audit --no-fund
		run_cmd wxt build -b firefox
	)

	SOURCES_BUILD_DIR="$SOURCES_DIR/.output/atbc"
	if [ ! -d "$SOURCES_BUILD_DIR" ]; then
		print_error "Error: No build output at $SOURCES_BUILD_DIR"
	fi

	if ! DIFF_OUTPUT=$(diff -ur "$BUILD_DIR" "$SOURCES_BUILD_DIR"); then
		echo "$DIFF_OUTPUT"
		print_error "Error: Build output from sources does not match extension."
	else
		print_success "Success: Extension build and sources zip are ready."
		exit 0
	fi
else
	print_error "Error: Unsupported flag '${1:-}'."
fi
