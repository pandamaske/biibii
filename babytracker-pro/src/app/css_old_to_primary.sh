#!/usr/bin/env bash
set -euo pipefail

echo "🌈 Migration Checklist ➜ HomePage (palette primary/amber/emerald)…"

# ---- REGEX SUBSTITUTIONS ---------------------------------------------------
PATTERNS=(
  # page-level gradients
  -e 's/from-primary-50/from-primary-50/g'
  -e 's/bg-gradient-to-b from-primary-50/bg-gradient-to-b from-primary-50/g'
  -e 's/from-primary-500 to-emerald-600/from-primary-500 to-primary-600/g'

  # green → primary text / bg / border
  -e 's/text-primary-100/text-primary-100/g'
  -e 's/text-primary-600/text-primary-600/g'
  -e 's/text-primary-700/text-primary-700/g'
  -e 's/text-primary-800/text-primary-800/g'
  -e 's/bg-primary-50/bg-primary-50/g'
  -e 's/bg-primary-100/bg-primary-100/g'
  -e 's/border-primary-300/border-primary-300/g'

  # CTA button gradients
  -e 's/bg-gradient-to-r from-blue-500 to-blue-600/bg-gradient-to-r from-primary-500 to-primary-600/g'
  -e 's/bg-gradient-to-r from-purple-500 to-purple-600/bg-gradient-to-r from-emerald-500 to-emerald-600/g'

  # yellow → amber (bg / text / border)
  -e 's/bg-yellow-\([0-9]\{2,3\}\)/bg-amber-\1/g'
  -e 's/text-yellow-\([0-9]\{2,3\}\)/text-amber-\1/g'
  -e 's/border-yellow-\([0-9]\{2,3\}\)/border-amber-\1/g'
)

# ---- APPLY WITH BSD-compatible sed ----------------------------------------
find src/app -name "*.tsx" -type f -print0 \
  | xargs -0 sed -i'' -E "${PATTERNS[@]}"

echo "✅ Migration terminée !"
