---
name: code-reviewer
description: Reviews code changes for bugs, security issues, performance problems, missing tests and style. Use this skill whenever the user asks to review code, a diff, a commit, a branch, a pull request or specific files, says "check my code", "look over this change", "is this OK to merge", "find bugs", or wants a second opinion on code quality, even if they never say the word "review".
---

# Code Review

Give the author feedback they can act on immediately: real problems first, clearly explained, with a concrete fix. Skip noise.

## 1. Decide the scope
Work out what to review before reading any code:
- User named files or folders -> review those.
- User said "my changes", "this branch" or "PR" -> run `git diff`.
- If the change touches more than ~10 files, use `subagentlarbilanishla` in parallel, then merge.

## 2. Review checklist (Priority Order)
1. **Correctness**: logic errors, off-by-one, null/undefined, race conditions, edge cases.
2. **Security**: SQL/shell/XSS injection, auth/role checks, hardcoded secrets, data leakage.
3. **Error handling**: unhandled promises, crashes, state corruption.
4. **Performance**: N+1 queries, memory leaks, blocking async calls.
5. **Tests**: missing coverage, flaky tests.
6. **Compatibility & Readability**: API breakages, code clarity.

## 3. Severity Levels
- **Critical**: Security hole, crash, data loss. Must fix.
- **Major**: Likely failure or maintainability issue. Should fix.
- **Minor**: Small improvement.
- **Nit**: Style or naming.

## 4. Output Format
- **Summary**: 2-3 sentences (Approve / Approve with comments / Request changes).
- **Findings**: `file:LINE` - [Severity] Issue + Fix.
- **What is good**: Honest praise.
- **Suggested tests**: If needed.
