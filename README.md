# ✈️ Flight Logistics Automator

This script transforms a single Google Calendar flight entry into a full, minute-by-minute travel itinerary. It handles airport club locations, security timing, Uber reservations, and check-in tasks automatically.

## 🛠️ Setup
1. **The Anchor:** Create a calendar event for your flight. 
   * **Title:** Must include `#flightanchor` and the gate if known (e.g., `ORD to DEN at Gate B12 #flightanchor`).
   * **Location:** Enter the airport (e.g., `Chicago O'Hare`). Google will auto-complete the full address.
2. **The Script:** Paste the code into [Google Apps Script](https://script.google.com/).
3. **Services:** Enable the **Google Tasks API** in the "Services" tab on the left sidebar.
4. **Trigger:** Set a "Time-driven" trigger to run the function `automateFlightEvents` every 30 minutes.

---

## 📅 The Itinerary Logic (Relative to Departure)
The script generates `#flightmanaged` events using the following timeline:

| Time Before | Duration | Event Title | Location Field |
| :--- | :--- | :--- | :--- |
| **-150 mins** | 30 mins | **NEEDS Reserved Uber to [Airport Code]** | Full Street Address |
| **-120 mins** | 15 mins | **Security at [Airport Code]** | Full Street Address |
| **-105 mins** | 15 mins | **Walk to United Club** | Full Street Address |
| **-90 mins** | 15 mins | **United Club [Specific Location]** | Full Street Address |
| **-75 mins** | 15 mins | **Walk to Gate [ID]** | Full Street Address |
| **-60 mins** | 60 mins | **Boarding [Flight Title]** | Full Street Address |
| **Arrival** | 30 mins | **NEEDS Reserved Uber to** | Destination Code |

---

## ✨ Key Features

### 📍 Full Address Sync
The script captures the high-fidelity address from your `#flightanchor` (e.g., *10000 W O'Hare Ave*) and populates the **Location** field of every logistical event. This ensures one-tap navigation in Google Maps or the Uber app.

### 🥪 Smart Club Routing
The script automatically identifies the closest **United Club** based on your gate:
* **ORD:** Logic for B6, B18, or C10.
* **DEN:** Logic for

---

## 🔁 Git + Apps Script Automation

This repository enforces sync and documentation checks through git hooks:

1. `post-commit` automatically runs `clasp push` after each commit.
2. `pre-push` blocks `git push` if `clasp push` fails.
3. `pre-commit` blocks commits when key files change without `README.md` staged.

Key files checked by `pre-commit`:

- `Code.gs`
- `appsscript.json`
- `.clasp.json`
- `.githooks/*`

If you intentionally need to bypass hook checks for one commit, use:

```bash
git commit --no-verify
```
