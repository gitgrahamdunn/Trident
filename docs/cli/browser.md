---
summary: "CLI reference for `openclaw browser` (profiles, tabs, actions, extension relay)"
read_when:
  - You use `openclaw browser` and want examples for common tasks
  - You want to control a browser running on another machine via a node host
  - You want to use the Chrome extension relay (attach/detach via toolbar button)
title: "browser"
---

# `trident browser`

Manage Trident’s browser control server and run browser actions (tabs, snapshots, screenshots, navigation, clicks, typing).

Related:

- Browser tool + API: [Browser tool](/tools/browser)
- Chrome extension relay: [Chrome extension](/tools/chrome-extension)

## Common flags

- `--url <gatewayWsUrl>`: Gateway WebSocket URL (defaults to config).
- `--token <token>`: Gateway token (if required).
- `--timeout <ms>`: request timeout (ms).
- `--browser-profile <name>`: choose a browser profile (default from config).
- `--json`: machine-readable output (where supported).

## Quick start (local)

```bash
trident browser setup tauri --app-command ./src-tauri/target/debug/my-app
trident browser setup playwright
trident browser doctor
trident browser profiles
trident browser --browser-profile openclaw start
trident browser --browser-profile openclaw open https://example.com
trident browser --browser-profile openclaw snapshot
```

## Tauri / WebDriver setup

Use a dedicated managed profile for native Tauri app testing:

```bash
trident browser setup tauri --app-command ./src-tauri/target/debug/my-app
trident browser doctor
trident browser --browser-profile tauri start
trident browser --browser-profile tauri status
```

Tauri WebDriver profiles are for native desktop app lifecycle/status. Use Playwright/CDP browser profiles for browser snapshots, screenshots, traces, and ref-based browser actions.

## Profiles

Profiles are named browser routing configs. In practice:

- `openclaw`: launches/attaches to a dedicated OpenClaw-managed Chrome instance (isolated user data dir).
- `user`: controls your existing signed-in Chrome session via Chrome DevTools MCP.
- `chrome-relay`: controls your existing Chrome tab(s) via the Chrome extension relay.

```bash
trident browser profiles
trident browser create-profile --name work --color "#FF5A36"
trident browser delete-profile --name work
```

Use a specific profile:

```bash
trident browser --browser-profile work tabs
```

## Tabs

```bash
trident browser tabs
trident browser open https://docs.openclaw.ai
trident browser focus <targetId>
trident browser close <targetId>
```

## Snapshot / screenshot / actions

Snapshot:

```bash
trident browser snapshot
```

Screenshot:

```bash
trident browser screenshot
```

Navigate/click/type (ref-based UI automation):

```bash
trident browser navigate https://example.com
trident browser click <ref>
trident browser type <ref> "hello"
```

## Chrome extension relay (attach via toolbar button)

This mode lets the agent control an existing Chrome tab that you attach manually (it does not auto-attach).

Install the unpacked extension to a stable path:

```bash
trident browser extension install
trident browser extension path
```

Then Chrome → `chrome://extensions` → enable “Developer mode” → “Load unpacked” → select the printed folder.

Full guide: [Chrome extension](/tools/chrome-extension)

## Remote browser control (node host proxy)

If the Gateway runs on a different machine than the browser, run a **node host** on the machine that has Chrome/Brave/Edge/Chromium. The Gateway will proxy browser actions to that node (no separate browser control server required).

Use `gateway.nodes.browser.mode` to control auto-routing and `gateway.nodes.browser.node` to pin a specific node if multiple are connected.

Security + remote setup: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)
