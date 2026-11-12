# Contributing

Contributions are welcome. Questions and design discussion go to the
[INATrace mailing list](https://lists.agstack.org/g/inatrace); bugs and feature
requests go to [GitHub issues](https://github.com/agstack/inatrace-frontend/issues).
Report security problems privately, as described in [SECURITY.md](SECURITY.md).

## Setup

You need Node 14 (pinned in `.nvmrc`, so `nvm use` picks it), npm, and Chrome or
Chromium for the tests. [docs/getting-started.md](docs/getting-started.md) covers
running the frontend locally against a backend.

## Tests

```
npm ci
npm run test:ci
```

The unit tests run with Karma in headless Chrome, as CI runs them; `npm test` runs
them in watch mode. All of them must pass before a pull request is merged.

- A bug fix comes with a spec that fails without it.
- `src/api` is generated from the backend's API (`npm run generate-api`) and
  committed. Regenerate it rather than editing it by hand.
- New user-facing text needs an i18n id, like the text around it.

## Pull requests

- Open an issue before you write the code for a feature, a change in behaviour
  or a bug that needs discussion, so the approach is agreed first. A typo, a
  one-line fix or a small documentation change needs no issue.
- If the pull request resolves an issue, write `Closes #<issue>` in its
  description so the issue closes when it merges. If it is only part of the
  work, write `Part of #<issue>` instead.
- Branch from `main` and keep each pull request to one change.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit
  subjects and pull request titles, and reference the issue when there is one:
  `fix: confirm payments from the list and in bulk (#15)`.
- If the change needs a backend change to work, link the backend pull request
  and say whether the two must be deployed together.
- Update the documentation in `docs/` that your change makes wrong, in the same
  pull request, screenshots included when a screen changes.

## Sign your commits

Every commit must carry a [Developer Certificate of Origin](https://developercertificate.org/)
(DCO) sign-off. With it you certify that you wrote the change, or otherwise have
the right to submit it under the project's license. Pull requests with unsigned
commits are not merged.

Add the sign-off with `git commit -s`, which appends a line with the name and
email from your Git configuration:

```
Signed-off-by: Jane Doe <jane@example.com>
```

The email must match the commit author. The sign-off is a person's
certification, so it is always made by a human, also for changes written with
the help of a tool.

To sign off commits you already made, run `git commit --amend --signoff` for
the last one, or `git rebase --signoff main` for every commit on your branch,
then `git push --force-with-lease`.

## License

By contributing, you agree that your contribution is licensed under the same
terms as the rest of the project; see [LICENSE](LICENSE).
