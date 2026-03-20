# Trident

Trident is a hardened fork of OpenClaw for autonomous local-first software development. It keeps the agent gateway and orchestration model, but ships as its own CLI, package, repo, and state root so upstream OpenClaw updates do not overwrite your runtime.

Primary release goals:
- separate binary: `trident`
- separate state/config root: `~/.trident`
- explicit migration from `~/.openclaw`
- stricter orchestration integrity for multi-agent work
- Trident-first runtime/help branding

## Install

Runtime: Node.js 22.12+

```bash
npm install -g trident
```

Verify:

```bash
trident --version
trident --help
```

## First Run

If you already have an OpenClaw setup, import it once:

```bash
trident migrate-from-openclaw
```

Trident will use:
- config: `~/.trident/trident.json`
- state: `~/.trident`
- workspaces: `~/.trident/workspaces/...`

Trident does not write back into `~/.openclaw`.

## Common Commands

```bash
trident setup
trident onboard --install-daemon
trident gateway restart
trident status
trident doctor
```

## Release Notes For This Fork

This fork intentionally changes runtime identity and packaging:
- package name is `trident`
- CLI entrypoint is `trident`
- self-update through the old OpenClaw path is disabled
- compatibility fallbacks may still accept some legacy `OPENCLAW_*` env vars internally

That compatibility is runtime-only. Normal Trident output should use Trident naming.

## Docs

The CLI may reference `docs.trident.ai`. For this release, treat those links as placeholders unless the site is live. The GitHub repo and local help output are the current source of truth.

## Release Scope

This release focuses on:
- safe separation from OpenClaw package updates
- reliable local state isolation
- hardened multi-agent orchestration behavior
- Trident-branded CLI/help output

It does not attempt to rename every internal OpenClaw symbol or protocol identifier. Some internal compatibility names remain by design where changing them would risk runtime behavior.

## License

MIT
