# Site & codebase audit — [Month YYYY]

> **Usage:** Copy this file to `docs/AUDIT-YYYY-MM.md`, fill in the blanks,
> delete the usage note. See `docs/AUDIT-2026-06.md` for a complete worked
> example. To kick off a formal audit cycle, file an issue from
> `.github/ISSUE_TEMPLATE/audit.yml`.

A full review of the **deployed site** ([URL], commit `[SHA]` — deploy
confirmed current) and the **codebase**, covering design, UX, UI,
functionality, accessibility, SEO, performance, tests, and CI. Live behavior
was verified in [browser/device]. Code findings come from a file-by-file review
of the areas listed under § 2.

## Severity scale

| Level | Meaning |
|---|---|
| **P0** | Broken in production or data-loss / security risk. Fix before merge. |
| **P1** | Visibly wrong, misleading, or a real a11y / SEO failure. Fix in Wave 1 or 2. |
| **P2** | Quality, consistency, DX. Schedule for the current or next sprint. |
| **Consider** | Good idea but not a defect. File a feature issue if the effort is bounded. |

Every code finding must carry `file:line` so the implementing agent can jump
directly to the source.

---

## 1. Executive summary

[2-4 sentence summary: what is good, what is broken, what is the biggest risk.
Name the P0s explicitly. The summary is what a time-pressed contributor reads.]

### Top 10 (fix in this order)

| # | Finding | Where | Sev |
|---|---|---|---|
| 1 | [short description] | [file or route] | P0/P1/P2 |
| 2 | … | … | … |
| … | … | … | … |

---

## 2. Live-site verification log

What was actually exercised (browser, theme, interactivity):

- Routes visited:
- Theme toggle:
- Key interactions:
- Console monitored: [yes/no, any errors?]
- **Not verified:** [list anything that could not be verified — mobile, auth
  flows, etc. — so the reader knows the blind spots]

---

## 3. P0 — broken in production

### 3.N [Short title] *(Top 10 #N)*

[Description of the bug, reproduction steps, root cause, file:line.]

**Fix:** [one-line description of the fix]

---

## 4. P1 — visibly wrong or a11y / SEO failures

### 4.1 [Area: e.g. Design & branding]

[Bullet list or table with `file:line`, finding, fix.]

### 4.2 [Area: e.g. Navigation & routing]

…

### 4.3 [Area: e.g. Accessibility]

…

### 4.4 [Area: e.g. SEO & metadata]

…

### 4.5 [Area: e.g. Performance]

…

### 4.6 [Area: e.g. i18n / localization]

…

---

## 5. Codebase findings — components & islands

### 5.1 UI primitives (`src/components/ui/`)

| File:line | Finding | Fix |
|---|---|---|
| … | … | … |

### 5.2 Islands / stores / lib

| File:line | Finding | Fix |
|---|---|---|
| … | … | … |

### 5.3 Pages / layouts / content / config

| File:line | Finding | Sev |
|---|---|---|
| … | … | … |

---

## 6. Tests, CI, dependencies

### 6.1 CI correctness

| File:line | Finding | Fix |
|---|---|---|
| … | … | … |

### 6.2 Test quality

[Which tests are behavioral vs source-text assertions? What are the three
highest-leverage behavioral tests to add?]

### 6.3 Dependency hygiene

[Packages in wrong section, stale pins, unused packages, etc.]

---

## 7. Feature proposals (ranked by leverage)

1. [Highest-leverage improvement — should close a gap identified in the audit]
2. …

---

## 8. Execution order

> **Status:** Pending — wave plan TBD. File an issue for each wave.

**Wave 1 — production fixes (one short PR each, behavioral test first):**
[P0s and the most critical P1s. tdd-tier: strict]

**Wave 1b — prerequisites (before parallelizing anything):**
[CI correctness, environment fixes. tdd-tier: smoke]

**Wave 2 — trust & polish:**
[Remaining P1s — a11y, SEO, UX fixes. tdd-tier: strict for behavior, smoke
for source-level guards]

**Wave 3 — P2 quality sweep:**
[Consistency, DX, dependency hygiene. tdd-tier: exempt for pure config changes]

**Wave 4 — features:**
[File individual issues from §7. The audit issue can be closed when all P0/P1
findings have merged.]

### Verification log

Record each wave's outcome here once it ships:

| Wave | Issue | Merged | Gate |
|---|---|---|---|
| 1 | #N | YYYY-MM-DD | [N tests green, astro check 0 errors] |
| 1b | #N | … | … |
| 2 | #N | … | … |
| 3 | #N | … | … |
| 4 | #N | … | … |

> **Audit closed:** [date] — every actionable item executed.
