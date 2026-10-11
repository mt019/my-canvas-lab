# Vite 8 delivery — 2026-10-12

Objective: publish the verified Vite 8 upgrade at https://canvas.phenomcanvas.com using the existing preview and immutable-artifact promotion workflow.

User authorized completing delivery and investigating/restoring the existing Supabase login. No DNS, billing, account replacement or unrelated feature change is included.

This worktree starts from remote main `8d61d31`, retaining the deployed Vintage REC feature and remote prerender fixes. Only Vite, its React plugin, the lockfile and preserved browser baseline are changed. The user's original divergent main branch and dirty files remain untouched.

Home stays pinned to its currently deployed commit `7f7e067cbc97d391c05acef4850eca53d839d8e6`. Canvas rollback target is the existing deployed commit `51cadf4e1c4685606094008f82a3f82c1e757b2b`; use the existing Pages rollback workflow and recorded production deployment IDs if necessary.

Acceptance: passing preview workflow, immutable artifact promotion, public manifest matching the upgrade commit, HTTPS/content/assets/robots/404 checks, and Supabase authorization endpoint redirecting to GitHub. A successful deployment does not establish a working login.

Supabase: `kbbraozovnmdzuhwfskz.supabase.co` returns NXDOMAIN in local, Google and Cloudflare DNS checks. User supplied dashboard text confirming the project is paused, data is safe, and Resume project is available. No management API credential is available. The connected browser failed before navigation with a missing `sandboxPolicy` tool error. User has been asked to click Resume; restoration is not yet verified. Low activity on the Free plan is a possible cause, not a confirmed audit finding.

Candidate commit: `1b9bcf7c1771e07e11ff36328c2cdb3f7f4ec437`, pushed to remote main. Full build including 26 routes passed. Preview run `38164403988` succeeded, all 10 cross-site checks passed, and immutable preview manifests matched the pinned commits.

Canvas preview: https://66cc8f4b.phenom-canvas.pages.dev

Production promotion run: `38164608565` succeeded. Vite 8 is publicly delivered at https://canvas.phenomcanvas.com. Custom-domain DNS resolves to Cloudflare; HTTPS returns 200; Canvas manifest matches `1b9bcf7`; Home remains at the pinned commit; JS assets return 200 with immutable caching; robots permit indexing; unknown routes return 404. DNS and billing were not changed. Production immutable URLs: Home https://89fde871.phenom-home.pages.dev and Canvas https://4ebc4a29.phenom-canvas.pages.dev.

Supabase recovery: DNS resolved again, initially with 502 `Bad Gateway`. At 2026-10-12 02:39:28 Asia/Taipei, the authorization endpoint returned 302 to `https://github.com/login/oauth/authorize`, with callback to the existing Supabase project and redirect to Canvas. The original DNS/authorization-entry failure is resolved. Full authenticated callback/login remains a user-driven test; do not claim it passed. No provider replacement or paid upgrade was performed.

Public custom-domain smoke also passed all 10 checks. Next action: user completes GitHub login from Canvas; investigate only if the callback fails. Upgrade delivery and authorization-entry recovery are complete. Original divergent worktree and unrelated dirty files remain untouched.

Verified Cloudflare rollback targets: Home `00645de9-b47f-43c3-8fea-a1c1fd2c57fb`; Canvas `a99bc05d-61fc-4641-8305-dc18931dcd6c`. Use phenom-ops `rollback-apex-pages.yml`, site and deployment_id inputs, action inspect before rollback. Historical Vercel fields are included only because the existing validator requires them; Vercel is retired and is not a viable rollback provider.
