# AGENTS.md

Instructions for coding agents working in this repository. Humans: the same rules
apply; `README.md` and `docs/` are the place to start.

## What this is

The INATrace web frontend: Angular 10, TypeScript 3.9, npm, **Node 14** (pinned in
`.nvmrc`; later majors stop the dev server at startup). It talks to the Java backend
(`inatrace-backend`) at `/api` on the same host. Read `docs/` before changing behaviour.

## Build and test

```bash
nvm use                      # Node 14, from .nvmrc
npm ci
npm run test:ci              # unit tests once, headless Chrome, as CI runs them
npm run build:prod           # production build into dist/
npm run dev                  # dev server on :4200, /api proxied to the backend on :8080
```

- The unit tests are Karma + Jasmine in Chrome; point `CHROME_BIN` at a Chrome or
  Chromium if Karma does not find one. Specs sit next to the code they test
  (`*.spec.ts`). Most components need `TESTING_IMPORTS` and `TESTING_PROVIDERS` from
  `src/testing/shared-testing.ts` in their `TestBed`.
- `npm run dev` needs `src/environments/environment.dev.ts`, which is git-ignored; see
  `docs/getting-started.md`. Never commit it.
- `npm run lint` reports thousands of existing issues and is not part of CI. Don't run
  `ng lint --fix` across the tree; lint only what you touch, and keep formatting
  changes out of unrelated files.
- Run the specs for what you touched (or `npm run test:ci`) before claiming a change
  works, and say what you ran. A fix comes with a spec that fails without it.

## Changing code

- Keep the style of the file you are in: comment density, naming, the existing
  services in `src/app/shared-services` and components in `src/app/shared`.
- `src/api` is generated from the backend's OpenAPI document (`npm run generate-api`,
  with the backend running on :8080) and committed. Don't edit it by hand; regenerate
  it, and commit the regeneration on its own or with the change that needs it.
- User-facing text is translated with Angular i18n (`i18n` attributes in templates,
  `$localize` in code), each with an explicit id (`i18n="@@area.thing.label"`) named
  like the ones around it. The catalogues are in `src/assets/locale/` (`en`, `de`,
  `es`, `rw`), and `npm run extract-i18n-generate-translations` refreshes them.
- Runtime settings reach the app through `window.env`: the image fills
  `src/assets/env.template.js` from environment variables at start, and
  `src/environments/environment*.ts` read it. A new setting needs both, plus its row in
  the table in `docs/building.md`.
- Backend and frontend ship separately. A change must keep working with the backend
  currently deployed, or the PR must say which backend PR it needs and why they have
  to deploy together.

## Documentation

`docs/` is published to <https://docs.agstack.org/> as-is. Update the page a change makes
wrong in the same commit, screenshots in `docs/images/` included when the screen
changes. Don't write run-specific numbers (test counts, timings) into `docs/`; they go
stale on the next commit.

## Commits and pull requests

- Conventional Commits: `<type>: <summary>`, lowercase, imperative, no trailing period
  (`fix:`, `feat:`, `test:`, `docs:`, `refactor:`, `chore:`, `ci:`, `build:`).
- One concern per PR. Reference the issue (`(#123)`) in the subject when there is one.
- No AI attribution: no `Co-Authored-By: Claude …` trailers, no "Generated with …" or
  "Prepared with LLM assistance" in commits, PR descriptions, issues or docs.
- Don't merge, rebase or push shared branches unless asked.
