# Vintage REC web delivery

## Execution contract

Objective: publish a usable Vintage REC tool at https://canvas.phenomcanvas.com/vintagerec, with video selection, effect preview, optional trim, effect controls and compressed MP4 export.

Primary milestone: verified public route and working browser export. Builds, commits and preview identifiers alone do not count as delivery.

Authority: user explicitly requested integration, push and publication. Use existing Cloudflare preview then immutable-artifact production promotion. No DNS, provider retirement, deletion or billing changes.

Scope: client-side processing using the fitted mathematical color/frame/light model from the desktop tool. No user video or classroom image will be published as an asset. Default light UI, automatic compression, optional settings collapsed, no IG branding in controls.

Safe checkpoint: isolated branch codex/vintage-rec-web based on origin/main 6ae8871. The main working directory has six earlier unpublished commits and unrelated dirty files; leave that checkout intact and keep this feature based on the current remote production-source lineage. phenom-ops also has unrelated dirty work; only invoke existing remote workflows.

Acceptance: meaningful browser render/export test including audio and trim, cancel handling, responsive UI, required repository checks, preview verification, production HTTPS/route/assets/canonical checks and recorded rollback target.

## Current state

- Desktop 0.2 works locally. The native app cannot execute directly in a static website; browser renderer implementation is required.
- Browser runtime connection failed before setup with a sandbox metadata error; use the project's existing Playwright test tooling as fallback for local development verification.
- Official Mediabunny conversion/output documentation inspected for streaming decode/encode; avoid reading large input videos into one array buffer.
- No production changes yet. Existing Canvas and Home rollback manifests/deployments must be captured before promotion.
- Next action: implement reusable browser effect renderer and page, run local checks, then push and build the isolated preview.
