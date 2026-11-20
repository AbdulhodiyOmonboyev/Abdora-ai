---
name: subagentlarbilanishla
description: Vazifalarni parallel subagentlar orqali bo'lib bajarish, tadqiqot, tahlil va birlashtirish skill'i. "subagentlarbilanishla" deb chaqirilganda ishga tushadi.
---

# Parallel Sub-agents (subagentlarbilanishla)

## When to use
- The task has 2+ parts that do not depend on each other's output.
- Each part is large enough to pollute the main context (reading many files, long analysis).

## Workflow
1. **Plan**: Break the task into independent subtasks (at most 5).
2. **Write brief**: Self-contained goal, non-overlapping files, constraints, output format.
3. **Launch in parallel**: Start subagents simultaneously.
4. **Collect**: Gather all responses.
5. **Merge**: Single unified report (Summary, Key Findings, Next Steps).
