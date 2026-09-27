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

## Implementation and local evidence

- User clarified the slow step is export. Desktop compression switched to hardware H.264 on macOS, tested and recorded in its own local repository at 44facc1.
- Web page uses local BlobSource decoding, WebGL effect rendering and browser H.264 encoding; default 1080p bounds / 30 fps / 4 Mbps, smaller 2 Mbps, higher 8 Mbps. Settings persist locally. Optional trim and advanced controls are collapsed. SDR only; unsupported tracks produce an error rather than silently losing audio.
- Large estimated outputs use origin-private disk storage; bounded OPFS branch test produced a 1,069,613-byte File and removed it afterward. This tests the storage path, not multi-gigabyte endurance.
- Actual paired-source 4K input, 2 s → 1080p export: approximately 2.1 s in local Chrome, H.264 2.000 s and AAC 2.005 s. Desktop CPU pipeline measurement was 18.279 s; hardware encoding 11.646 s. Short samples only; no full-duration speed guarantee, and the browser shader is a visual approximation.
- 0.25–1.25 s trim produced 1.000 s H.264 and 1.009 s AAC; cancel/retry returned to idle without a download; 390px layout has no overflow. Light UI visually inspected. Browser tests run with project Playwright because the in-app browser bootstrap is unavailable.
- All policy checks and full Cloudflare build passed; committed fonts cover new copy without rebuilding subsets. Reusable synthetic fixture check: `node scripts/test-vintage-rec.mjs [origin]`.
- Current production rollback deployments inspected successfully through read-only workflows: Canvas 420aef07-daa8-43ae-bed6-66b6df858aef (run 36299894138); Home 70beb0ec-3880-4418-aebb-a2682893e858 (run 36299896128). Existing source manifests: Canvas 6ae887191356383cf92f0ee199ce87f21c4630f8; Home 7f7e067cbc97d391c05acef4850eca53d839d8e6.
- Next: push isolated feature branch, build immutable preview with the current Home source, verify preview, promote and verify custom domain. No production change at this checkpoint.
