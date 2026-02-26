# ✈️ Flight Logistics Automator

This script transforms a single Google Calendar flight entry into a full, minute-by-minute travel itinerary. It handles airport club locations, security timing, Uber reservations, and check-in tasks automatically.

[Image of a flowchart showing a calendar event being expanded into multiple travel logistics events]

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
| **-150 mins** | 30 mins | **Reserved Uber to [Airport]** | Full Street Address |
| **-120 mins** | 15 mins
