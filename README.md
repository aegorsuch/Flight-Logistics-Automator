# ✈️ Flight Logistics Automator

This script transforms a single Google Calendar flight entry into a full, minute-by-minute travel itinerary. It handles airport club locations, security timing, Uber reservations, and check-in tasks automatically.

## 🛠️ Setup
1. **The Anchor:** Create a calendar event for your flight. 
   * **Title:** Must include `#flightanchor` and the gate if known (e.g., `ORD to DEN at Gate B12 #flightanchor`).
   * **Location:** Enter the airport (e.g., `Chicago O'Hare`). Google will auto-complete the full address.
2. **The Script:** Paste the code into [Google Apps Script](https://script.google.com/).
3. **Services:** Enable the **Google Tasks API** in the "Services" tab on the left sidebar.
4. **Trigger:** Set a "Time-driven" trigger to run the function `FlightLogisticsAutomator` every 30 minutes.

### Dry Run (Safe Validation)
Use `DryRunFlightLogistics` to simulate a full run without writing any changes.

- No Calendar events are created, updated, or deleted.
- No Google Tasks are created.
- Anchor descriptions are not modified.
- Planned actions are written to Apps Script execution logs.

---

## 📅 The Itinerary Logic (Relative to Departure)
The script syncs `#flightmanaged` events using the following timeline:

| Time Before | Duration | Event Title | Location Field |
| :--- | :--- | :--- | :--- |
| **-120 mins** | 15 mins | **Security at [Airport Code]** | Full Street Address |
| **-105 mins** | 15 mins | **Walk to United Club / near Gate [ID]** | Full Street Address |
| **-90 mins** | 30 mins | **United Club / near Gate [ID]** | Full Street Address |
| **-60 mins** | 15 mins | **Walk to Gate [ID]** | Full Street Address |
| **-45 mins** | 45 mins | **Board [Flight Title] (at Gate [ID] when available)** | Full Street Address |

---



- Anchor-scoped event/task tagging (#anchor:<id>) for deterministic updates
- Per-flight task deduplication
- Robust airport/gate parsing
- Orphan cleanup: deletes managed events when anchor is missing
- Dry-run mode: simulates all actions, logs intended changes
- Error reporting: sends email and creates special task on sync/cleanup failure
- Automated test harness: simulates anchor events and validates output
- Data validation: checks anchor event fields before processing
- Retry logic: retries Calendar/Tasks API calls with exponential backoff
- Config object: all timing, cleanup, and feature toggles are configurable
- API quota monitoring: alerts when Calendar/Tasks API usage nears quota limits, advanced tracking documented
- Automated README changelog
- Git hooks: post-commit, pre-push, pre-commit, run-big-checks, update-readme-autolog

## Usage

Run `FlightLogisticsAutomator()` for live sync, or `DryRunFlightLogistics()` for simulation.
Run `TestFlightLogisticsHarness()` to simulate anchor events and validate processing.

## Changelog

- v1.0: Initial linkage, sync, automation, enforcement
- v1.1: Stability hardening, anchor-scoped matching, dedupe, orphan cleanup
- v1.2: Dry-run mode, README auto-update
- v1.3: Error reporting, test harness, validation, retry logic, config object

### 🧭 Airport Code Parsing
Airport code parsing now supports route formats like `ORD to DEN`, `ORD->DEN`, and fallback token parsing for less structured anchor titles.

Script tuning constants in `Code.gs`:

- `SEARCH_AHEAD_DAYS` (default `14`)
- `CLEANUP_LOOKBACK_DAYS` (default `2`)
- `CLEANUP_ORPHAN_MANAGED_EVENTS` (default `true`)

---

## 🔁 Git + Apps Script Automation

This repository enforces sync and documentation checks through git hooks:

1. `post-commit` automatically runs `clasp push` after each commit.
2. `post-commit` also runs `.githooks/run-big-checks` in warning mode after every change.
3. `pre-push` runs `.githooks/run-big-checks` in strict mode and blocks `git push` when checks fail.
4. `pre-push` blocks `git push` if `clasp push` fails.
5. `pre-commit` auto-updates and stages `README.md` when key files change.

Enable hooks in a local clone with:

```bash
git config core.hooksPath .githooks
```

Key files checked by `pre-commit`:

- `Code.gs`
- `appsscript.json`
- `.clasp.json`
- `.githooks/*`

When those files are staged, `.githooks/update-readme-autolog` updates the `Auto Changelog`
section below and stages `README.md` automatically.
The changelog keeps the 5 most recent entries.

`run-big-checks` currently validates:

- required files are present (`README.md`, `Code.gs`, `appsscript.json`, `.clasp.json`)
- `Code.js` is not present (to avoid duplicate canonical script files)
- `clasp status` succeeds

If you intentionally need to bypass hook checks for one commit, use:

```bash
git commit --no-verify
```

## Auto Changelog

This section is updated automatically by git hooks when key files change.
It keeps the 5 most recent entries.

<!-- AUTO-CHANGELOG-START -->
- 2026-03-06 19:08 UTC | files: `Code.gs` | hook: pre-commit auto-sync
- 2026-03-06 17:54 UTC | files: `.githooks/update-readme-autolog` | hook: pre-commit auto-sync
- 2026-03-06 17:52 UTC: auto README sync for staged key changes (`.githooks/pre-commit,.githooks/update-readme-autolog`).
<!-- AUTO-CHANGELOG-END -->
