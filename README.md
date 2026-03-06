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

---

## ✨ Key Features

### 📍 Full Address Sync
The script captures the high-fidelity address from your `#flightanchor` (e.g., *10000 W O'Hare Ave*) and populates the **Location** field of every logistical event. This ensures one-tap navigation in Google Maps or the Uber app.

### ♻️ Idempotent Sync
The script updates existing managed events instead of creating duplicates, and uses a script lock to prevent overlap when triggers run concurrently.

### 🧾 Task De-duplication
Task titles are checked before insertion so reruns do not create duplicate Google Tasks entries.

### 🥪 Smart Club Routing
The script automatically identifies the closest **United Club** based on your gate:
* **ORD:** Logic for B6, B18, or C10.
* **DEN:** Logic for

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

<!-- AUTO-CHANGELOG-START -->
- 2026-03-06 17:52 UTC: auto README sync for staged key changes (`.githooks/pre-commit,.githooks/update-readme-autolog`).
<!-- AUTO-CHANGELOG-END -->
