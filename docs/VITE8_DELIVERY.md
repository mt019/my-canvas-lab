# Vite 8 delivery — 2026-10-12

Objective: publish the verified Vite 8 upgrade at https://canvas.phenomcanvas.com using the existing preview and immutable-artifact promotion workflow.

User authorized completing delivery and investigating/restoring the existing Supabase login. No DNS, billing, account replacement or unrelated feature change is included.

This worktree starts from remote main `8d61d31`, retaining the deployed Vintage REC feature and remote prerender fixes. Only Vite, its React plugin, the lockfile and preserved browser baseline are changed. The user's original divergent main branch and dirty files remain untouched.

Home stays pinned to its currently deployed commit `7f7e067cbc97d391c05acef4850eca53d839d8e6`. Canvas rollback target is the existing deployed commit `51cadf4e1c4685606094008f82a3f82c1e757b2b`; use the existing Pages rollback workflow and recorded production deployment IDs if necessary.

Acceptance: passing preview workflow, immutable artifact promotion, public manifest matching the upgrade commit, HTTPS/content/assets/robots/404 checks, and Supabase authorization endpoint redirecting to GitHub. A successful deployment does not establish a working login.

Supabase: `kbbraozovnmdzuhwfskz.supabase.co` returns NXDOMAIN in local, Google and Cloudflare DNS checks. No management API credential is available. The connected browser failed before navigation with a missing `sandboxPolicy` tool error. User has been asked to check/resume the project in their authenticated dashboard. Project pause/deletion remains unconfirmed.

Current milestone: build and verify a production candidate. Next action: dependency installation, policy/full validation, scoped commit/push, preview dispatch and external checks before promotion.
