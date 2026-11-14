---
name: new-feature
description: Checklist for a new Tyts feature or a noticeable change in what Tyts does. Use when the task adds something the person can see or switch - a new action, setting, page, window, key, download or use of a model ("add a feature", "new setting", "new screen", «добавь функцию», «новая настройка», «новый экран»). Do not use for bug fixes, wording or style tweaks, refactors, tests, docs or other small edits that add nothing new.
---

A new feature is done when every line below holds. Each is a rule of CLAUDE.md ("Rules that always hold"), which gives the reasons. Read the feature's part of `docs/history.md` before you start.

- [ ] **Three languages.** Every visible phrase is a key in `src/i18n/en.ts`, written in `uk.ts` and `ru.ts` in the same edit.
- [ ] **A test.** Pure logic sits in a module of its own with a `*.test.ts` beside it.
- [ ] **Resources.** If it holds memory, the processor or the graphics card, it has its line in the resource contract in `docs/backlog.md` («Контракт ресурсов»).
- [ ] **Privacy.** Logs and reports carry none of the person's text, only counts (`report.ts cleanText`).
- [ ] **Downloads.** Only through `fetchPinned` (`download.ts`), and only when the person asked.
- [ ] **Clipboard.** Only through `ClipboardGuard` (`clipguard.ts`).
- [ ] **The record.** The decision and its reason are written in `docs/history.md`, with the date.

The rest of CLAUDE.md (keys, look, words, security) applies as always. Finish as its "Working here" says.
