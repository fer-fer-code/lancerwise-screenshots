#!/bin/bash
# HTTP-layer indexability probe — runs without browser
# Reads from discovered-urls.txt, writes status-matrix.csv

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL_FILE="$ROOT/discovered-urls.txt"
OUT_CSV="$ROOT/status-matrix.csv"
DETAIL_DIR="$ROOT/http-details"

mkdir -p "$DETAIL_DIR"

echo "url,http_code,x_robots_tag,meta_robots,canonical,category,notes" > "$OUT_CSV"

categorize() {
  case "$1" in
    "https://www.lancerwise.com") echo "homepage" ;;
    *"/blog/"*) echo "blog-post" ;;
    *"/blog") echo "blog-index" ;;
    *"/login"|*"/register") echo "auth" ;;
    *"/pricing"|*"/about"|*"/contact"|*"/faq"|*"/demo") echo "marketing" ;;
    *"/tools/"*|*"/n8n-templates") echo "tools" ;;
    *"/privacy"|*"/terms"|*"/cookie-policy") echo "legal" ;;
    *"/api-docs"|*"/changelog") echo "resources" ;;
    *) echo "other" ;;
  esac
}

count=0
while IFS= read -r url; do
  [ -z "$url" ] && continue
  count=$((count + 1))
  slug=$(echo "$url" | sed -E 's|https?://[^/]+||; s|/|_|g; s|^_||; s|^$|home|')
  detail_file="$DETAIL_DIR/$count-$slug.txt"

  echo "[$count] $url"

  # HEAD: code + X-Robots-Tag
  head=$(curl -sI "$url" --max-time 10 || echo "FAIL")
  code=$(echo "$head" | head -1 | grep -oE '[0-9]{3}' | head -1)
  xrobots=$(echo "$head" | grep -iE '^x-robots-tag:' | tr -d '\r' | sed 's/^[xX]-[rR]obots-[tT]ag: *//' || true)

  # GET: HTML meta + canonical
  html=$(curl -s "$url" --max-time 12 || echo "")
  meta=$(echo "$html" | grep -ioE '<meta[^>]*name=["'\'']robots["'\''][^>]*>' | head -1 | sed -E 's/.*content=["'\'']([^"'\'']+)["'\''].*/\1/' || true)
  canonical=$(echo "$html" | grep -ioE '<link[^>]*rel=["'\'']canonical["'\''][^>]*>' | head -1 | sed -E 's/.*href=["'\'']([^"'\'']+)["'\''].*/\1/' || true)

  cat=$(categorize "$url")

  notes=""
  if [ -n "$xrobots" ]; then notes="X-Robots-Tag set"; fi
  if [ "$code" != "200" ]; then notes="HTTP $code"; fi

  echo "$url,$code,${xrobots:-none},${meta:-MISSING},${canonical:-MISSING},$cat,${notes:-clean}" >> "$OUT_CSV"

  {
    echo "URL: $url"
    echo "HTTP: $code"
    echo "X-Robots-Tag: ${xrobots:-(none)}"
    echo "Meta robots: ${meta:-(none)}"
    echo "Canonical: ${canonical:-(none)}"
    echo ""
    echo "--- Response headers ---"
    echo "$head" | head -25
  } > "$detail_file"

done < "$URL_FILE"

echo ""
echo "Done. $count URLs probed."
echo "CSV: $OUT_CSV"
echo "Per-URL details: $DETAIL_DIR/"
