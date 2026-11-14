---
name: release
description: Cut a Tyts release - check, bump the version, write the notes, commit, tag v<version> and push the tag. The owner runs it as /release [version].
disable-model-invocation: true
argument-hint: "[version]"
---

Release Tyts as "Release and updates" in CLAUDE.md describes. Version asked for: "$ARGUMENTS" (empty: the patch number of `version` in package.json plus one).

If a step fails, stop there and say why. Do not work around a failed check.

1. **Check.** `git status --porcelain` is empty, the tag `v<version>` does not exist yet, and `npm run typecheck` and `npm test` pass. On a Mac the failures CLAUDE.md lists as known are expected; any other failure stops the release.
2. **Version.** `npm version <version> --no-git-tag-version` (or `patch` in place of the number): package.json and package-lock.json together, no commit, no tag.
3. **Notes.** Add `## Tyts <version>` on top of `.github/release-notes.md`, from `git log <last tag>..HEAD`, written as the sections under it are: what the person sees, in plain words. `release.yml` puts this file into the draft release.
4. **Commit** these files as `<version>: <what changed, in plain words>`, the way the past release commits read (`git log -5`).
5. **Tag and push the tag.** `git tag v<version>`, then `git push origin v<version>`. `.github/workflows/release.yml` builds, tests and drafts the GitHub release.
6. **Report** the version, the commit and the notes written, and that the branch itself was not pushed. Remind the owner that publishing the draft release on GitHub is their step.
