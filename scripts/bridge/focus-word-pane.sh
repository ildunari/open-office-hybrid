#!/usr/bin/env bash
set -euo pipefail

TARGET="body"
ACTIVATE_WORD=true

usage() {
  cat <<EOF
Usage: $(basename "$0") [--target body|header|input] [--no-activate] [--help]

Focus or click inside the OpenWord Hybrid side panel using macOS accessibility.
This is a helper for bridge-based live testing, not a replacement for the main
state/tool/event/screenshot validation workflow.

Targets:
  body     Click the center of the pane body (default)
  header   Click the pane header / tab strip area
  input    Click the lower composer area

Options:
  --target NAME   Which pane region to click
  --no-activate   Do not bring Microsoft Word to the front first
  --help          Show this help

Exit codes:
  0  Click succeeded
  1  Pane not found or click failed
  2  Usage error
EOF
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --no-activate) ACTIVATE_WORD=false; shift ;;
    --help) usage 0 ;;
    --*) echo "Unknown option: $1" >&2; usage 2 ;;
    *) echo "Unexpected argument: $1" >&2; usage 2 ;;
  esac
done

case "$TARGET" in
  body|header|input) ;;
  *) echo "Unsupported target: $TARGET" >&2; usage 2 ;;
esac

APPLE_SCRIPT=$(cat <<'APPLESCRIPT'
on run argv
  clickPane(item 1 of argv, item 2 of argv is "true")
end run

on clickPane(targetName, shouldActivate)
  tell application "Microsoft Word"
    if shouldActivate then activate
  end tell
  delay 0.5

  tell application "System Events"
    tell process "Microsoft Word"
      if not (exists front window) then error "Microsoft Word has no front window."
      set paneGroup to missing value

      repeat with candidate in every UI element of splitter group 1 of front window
        try
          if class of candidate is group and name of candidate is "OpenWord Hybrid" then
            set paneGroup to candidate
            exit repeat
          end if
        end try
      end repeat

      if paneGroup is missing value then error "OpenWord Hybrid pane not found."

      set {xPos, yPos} to position of paneGroup
      set {paneWidth, paneHeight} to size of paneGroup

      if targetName is "header" then
        set targetPoint to {xPos + (paneWidth * 0.8), yPos + 40}
      else if targetName is "input" then
        set targetPoint to {xPos + (paneWidth / 2), yPos + paneHeight - 45}
      else
        set targetPoint to {xPos + (paneWidth / 2), yPos + (paneHeight / 2)}
      end if

      click at targetPoint

      return "{\"target\":\"" & targetName & "\",\"window\":\"" & (name of front window as text) & "\",\"paneX\":" & xPos & ",\"paneY\":" & yPos & ",\"paneWidth\":" & paneWidth & ",\"paneHeight\":" & paneHeight & ",\"clickX\":" & (item 1 of targetPoint) & ",\"clickY\":" & (item 2 of targetPoint) & ",\"clickedElement\":\"accessibility-click-issued\"}"
    end tell
  end tell
end clickPane

APPLESCRIPT
)

osascript - "$TARGET" "$ACTIVATE_WORD" <<<"$APPLE_SCRIPT"
