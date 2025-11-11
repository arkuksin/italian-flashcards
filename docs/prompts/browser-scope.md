# Prompt: Scope Cross-Browser Coverage

Use this prompt to instruct someone to keep Chromium as the full regression target while turning WebKit (and optional Firefox) into lean smoke suites so E2E minutes drop.

```
Repo: italian-flashcards. Adjust the Playwright project definitions so that:
- Chromium continues to run the entire `./e2e` directory.
- WebKit only runs tests tagged `@smoke` (create the tag and annotate ~10 high-signal specs such as `quick-auth-check`, `full-user-flow`, and `privacy-policy`).
- Firefox stays disabled in CI but remains available locally behind a flag.
- Add a npm script `test:e2e:smoke` that runs only the tagged tests for the non-Chromium browser.
- Update `.github/workflows/pr-e2e-tests.yml` matrix so Chromium uses `npx playwright test`, while WebKit uses the smoke command, and mention the new split in `docs/e2e-testing.md`.
Provide guidance in the PR body on how to choose future smoke tests.
```
