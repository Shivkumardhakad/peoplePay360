## 2026-09-05 11:58 IST — CI workflow

### Summary
- Added a GitHub Actions CI workflow that runs for every pushed commit and pull request.

### Files Changed
- `.github/workflows/ci.yml`: Added repository validation and conditional Node.js install, test, and build steps.
- `CHANGELOG_AGENTS.md`: Recorded this change.

### Reason
- Provide automated checks for each commit while keeping the workflow usable before application source files and package metadata are added.

### Validation
- `git diff --check` — passed
- `git status --short` — reviewed

### Notes
- The current repository has no `package.json`, so Node.js checks will be skipped until one is added.
