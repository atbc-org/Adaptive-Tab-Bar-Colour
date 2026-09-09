#!/bin/bash

set -euo pipefail
source "$(dirname "$0")/utils.sh"

cd "$(dirname "$0")/.."

base64url() {
	openssl base64 -e -A | tr "+/" "-_" | tr -d "=\n"
}

header=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64url)
issued_at=$(date +%s)
expires_at=$((issued_at + 300))
nonce=$(openssl rand -hex 16)

payload=$(
	printf '{"iss":"%s","jti":"%s","iat":%d,"exp":%d}' \
		"$FIREFOX_JWT_ISSUER" \
		"$nonce" \
		"$issued_at" \
		"$expires_at" |
		base64url
)

signature=$(
	echo -n "${header}.${payload}" |
		openssl dgst -sha256 -hmac "$FIREFOX_JWT_SECRET" -binary |
		base64url
)
token="${header}.${payload}.${signature}"

shopt -s nullglob
files=(amo/amo-*.md)
if [ ${#files[@]} -eq 0 ]; then
	print_error "Error: No amo/amo-*.md files found."
fi

description=$(
	for file in "${files[@]}"; do
		locale="${file#amo/amo-}"
		locale="${locale%.md}"
		jq -n \
			--arg loc "$locale" \
			--rawfile content "$file" \
			'{($loc): $content}'
	done | jq -s 'add'
)

body=$(jq -n --argjson desc "$description" '{"description": $desc}')

curl -sSf -o /dev/null -X PATCH \
	"https://addons.mozilla.org/api/v5/addons/addon/adaptive-tab-bar-colour/" \
	-H "Authorization: JWT ${token}" \
	-H "Content-Type: application/json" \
	-d "$body"

print_success "Success: AMO descriptions synchronised."
