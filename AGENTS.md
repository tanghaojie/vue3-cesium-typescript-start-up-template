# AI collaboration rules

- Read docs/README.md and the relevant design before substantive changes. Keep modules in independent directories and do not recreate the legacy Vuex/global Viewer architecture.
- Before modifying files, require an empty Git staging area; preserve pre-existing user changes. Work on a topic branch and preserve the 1.0.0 branch and tag.
- For substantive work, maintain design, an active plan and an AI log. Archive completed plans/logs with actual checks and pending human acceptance. Never record secrets.
- Use the root .prettierrc as the formatting source. Run pnpm format, pnpm format:check, pnpm lint and pnpm build after code changes.
- Do not create or run frontend unit, component, E2E or browser automation unless the user explicitly requests it. Type checks and builds do not replace human browser/GPU/encoding acceptance.
- Keep one Cesium Viewer clock per runtime; preserve capability boundaries, abort/dispose behavior and capture JSON version/storage compatibility.
- Use conventional commits. Every AI commit ends with a blank line and Co-Authored-By: -AI- followed by the actual model name and <ai@scaffold-proj.com>.
- This standalone repository has no Foundation/Platform ownership scopes or Forge synchronization/ledger. Do not import those roles from the source repository.
