#!/usr/bin/env bash
set -euo pipefail

repository_directory=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
smoke_directory=$(mktemp -d "${TMPDIR:-/tmp}/da-da-widget-project-smoke.XXXXXX")
archive_directory="$smoke_directory/archives"
toolbox_directory="$smoke_directory/toolbox"
project_directory="$smoke_directory/reading-list"
server_process_id=''

cleanup() {
  if [[ -n "$server_process_id" ]]; then
    kill "$server_process_id" 2>/dev/null || true
    wait "$server_process_id" 2>/dev/null || true
  fi
  rm -rf "$smoke_directory"
}

trap cleanup EXIT
mkdir -p "$archive_directory" "$toolbox_directory"

npm run build --prefix "$repository_directory/packages/widget-contract"
npm run build --prefix "$repository_directory/packages/widget-angular"

pack_tool() {
  local package_directory=$1
  local output_file=$2
  (
    cd "$package_directory"
    npm pack --json --pack-destination "$archive_directory" > "$output_file"
  )
}

archive_name() {
  node -e "process.stdout.write(JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8'))[0].filename)" "$1"
}

assert_archive_files() {
  local archive_path=$1
  shift
  local actual
  actual=$(tar -tzf "$archive_path" | sort)
  local expected
  expected=$(printf '%s\n' "$@" | sort)

  if [[ "$actual" != "$expected" ]]; then
    printf 'Unexpected contents in %s.\nExpected:\n%s\nActual:\n%s\n' \
      "$archive_path" "$expected" "$actual" >&2
    return 1
  fi
}

pack_tool "$repository_directory/packages/widget-contract" "$archive_directory/contract.json"
pack_tool "$repository_directory/packages/widget-angular" "$archive_directory/angular.json"
pack_tool "$repository_directory/packages/widget-project" "$archive_directory/project.json"

contract_archive="$archive_directory/$(archive_name "$archive_directory/contract.json")"
angular_archive="$archive_directory/$(archive_name "$archive_directory/angular.json")"
project_archive="$archive_directory/$(archive_name "$archive_directory/project.json")"

assert_archive_files "$contract_archive" \
  package/dist/public-api.d.ts \
  package/dist/public-api.js \
  package/package.json
assert_archive_files "$angular_archive" \
  package/dist/public-api.d.ts \
  package/dist/public-api.js \
  package/package.json
assert_archive_files "$project_archive" \
  package/bin/create-widget.mjs \
  package/lib/check-built-widget.mjs \
  package/package.json

npm install --prefix "$toolbox_directory" --no-save "$project_archive"
"$toolbox_directory/node_modules/.bin/create-da-da-widget" \
  --name reading-list \
  --type reading-list \
  --display-name 'Reading list' \
  --description 'Books to read next' \
  --element-tag example-reading-list \
  --settings-element-tag example-reading-list-settings \
  --version 1.0.0 \
  --width 3 \
  --height 2 \
  --output "$project_directory"

if rg --fixed-strings --quiet "$repository_directory" "$project_directory"; then
  printf 'Generated Widget Project contains a Dashboard repository path.\n' >&2
  exit 1
fi

npm install --prefix "$project_directory" --no-save "$contract_archive" "$angular_archive"

if find "$project_directory/node_modules" -type l -exec readlink -f {} \; | rg --fixed-strings --quiet "$repository_directory"; then
  printf 'Generated Widget Project installed a Dashboard workspace link.\n' >&2
  exit 1
fi

if rg --fixed-strings --quiet 'file:' "$project_directory/package.json"; then
  printf 'Generated Widget Project declares a local file dependency.\n' >&2
  exit 1
fi

npm test --prefix "$project_directory"
npm run check --prefix "$project_directory"
npm run build --prefix "$project_directory"

npm start --prefix "$project_directory" > "$smoke_directory/widget-server.log" 2>&1 &
server_process_id=$!

for _ in $(seq 1 60); do
  if curl --fail --silent --show-error \
    --header 'Origin: http://localhost:4200' \
    --output "$smoke_directory/widget-manifest.json" \
    --dump-header "$smoke_directory/widget-manifest.headers" \
    http://localhost:4201/widget-manifest.json; then
    break
  fi
  sleep 1
done

test -s "$smoke_directory/widget-manifest.json"
rg --fixed-strings --quiet 'Access-Control-Allow-Origin: *' "$smoke_directory/widget-manifest.headers"
node -e "const manifest = JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8')); if (manifest.type !== 'reading-list' || manifest.elementTag !== 'example-reading-list' || manifest.settingsElementTag !== 'example-reading-list-settings') process.exit(1);" "$smoke_directory/widget-manifest.json"

printf 'Independent Widget Project smoke test passed.\n'
