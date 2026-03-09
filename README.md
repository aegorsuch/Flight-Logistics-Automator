[![codecov](https://codecov.io/gh/aegorsuch/Flight-Logistics-Automator/branch/main/graph/badge.svg)](https://codecov.io/gh/aegorsuch/Flight-Logistics-Automator)

# ✈️ Flight Logistics Automator

This script transforms a single Google Calendar flight entry into a full, minute-by-minute travel itinerary. It handles airport club locations, security timing, Uber reservations, and check-in tasks automatically.

## 🛠️ Setup
1. **The Anchor:** Create a calendar event for your flight. 
   * **Title:** Must include `#flightanchor` and the gate if known (e.g., `ORD to DEN at Gate B12 #flightanchor`).
   * **Location:** Enter the airport (e.g., `Chicago O'Hare`). Google will auto-complete the full address.
2. **The Script:** Paste the code into [Google Apps Script](https://script.google.com/).
3. **Services:** Enable the **Google Tasks API** in the "Services" tab on the left sidebar.
4. **Trigger:** Set a "Time-driven" trigger to run the function `FlightLogisticsAutomator` every 30 minutes.

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
| **+15 mins after end** | 15 mins | **Deplane from [Origin] to [Arrival]** | Arrival airport's location (if available) |

---



- Anchor-scoped event/task tagging (#anchor:<id>) for deterministic updates
- Per-flight task deduplication
- Orphan cleanup: deletes managed events when anchor is missing
- Error reporting: sends email and creates special task on sync/cleanup failure
- Automated test harness: simulates anchor events and validates output
- Data validation: checks anchor event fields before processing
- Retry logic: retries Calendar/Tasks API calls with exponential backoff
- Config object: all timing, cleanup, and feature toggles are configurable
- API quota monitoring: alerts when Calendar/Tasks API usage nears quota limits, advanced tracking documented
- Automated README changelog
- Git hooks: post-commit, pre-push, pre-commit, run-big-checks, update-readme-autolog

## Usage

Run `FlightLogisticsAutomator()` for live sync.

## Changelog

- v1.0: Initial linkage, sync, automation, enforcement
- v1.1: Stability hardening, anchor-scoped matching, dedupe, orphan cleanup
- v1.3: Error reporting, test harness, validation, retry logic, config object

### 🧭 Airport Code Parsing
Airport code parsing now supports route formats like `ORD to DEN`, `ORD->DEN`, and fallback token parsing for less structured anchor titles.

Script tuning constants in `Code.gs`:

- `SEARCH_AHEAD_DAYS` (default `14`)
- `CLEANUP_LOOKBACK_DAYS` (default `2`)
- `CLEANUP_ORPHAN_MANAGED_EVENTS` (default `true`)

---

## 🧪 Testing & Coverage

To run tests and check coverage:

1. Install dependencies:
   ```sh
   npm install
   ```
2. Run tests:
   ```sh
   npm test
   ```
3. Generate coverage report:
   ```sh
   npm run coverage
   ```

Coverage results will be uploaded to Codecov automatically if you push to GitHub.

## ✨ Usage Example

To extract a gate from a flight title:

```js
const { parseGateFromTitle_ } = require('./flightUtils');

const gate = parseGateFromTitle_('ORD to DEN at Gate B12 #flightanchor');
console.log(gate); // Output: B12
```

## Auto Changelog

This section is updated automatically by git hooks when key files change.
It keeps the 5 most recent entries.

<!-- AUTO-CHANGELOG-START -->
- 2026-03-09 19:59 UTC | files: `Code.gs` | hook: pre-commit auto-sync
- 2026-03-09 19:41 UTC | files: `Code.gs` | hook: pre-commit auto-sync
- 2026-03-06 19:09 UTC | files: `Code.gs` | hook: pre-commit auto-sync
- 2026-03-06 19:08 UTC | files: `Code.gs` | hook: pre-commit auto-sync
- 2026-03-06 17:54 UTC | files: `.githooks/update-readme-autolog` | hook: pre-commit auto-sync
<!-- AUTO-CHANGELOG-END -->
