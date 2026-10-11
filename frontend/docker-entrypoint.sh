#!/bin/sh
# Inject runtime API URL into the served entry HTML.
# Reads $API_URL (e.g. https://api.example.com/api/v1); falls back to
# localhost when unset so plain `docker run` still works for smoke tests.
set -eu
HTML=/usr/share/nginx/html/DecideAI.html
API_URL_VALUE="${API_URL:-http://localhost:3000/api/v1}"
# Escape for sed (delimiter #) + JS string: \, &, #, ".
ESCAPED=$(printf '%s' "$API_URL_VALUE" | sed -e 's/\\/\\\\/g' -e 's/&/\\&/g' -e 's/#/\\#/g' -e 's/"/\\"/g')
sed -i "s#window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};#window.__APP_CONFIG__ = { API_URL: \"$ESCAPED\" };#" "$HTML"
exec "$@"
