# ✈️ Flight Logistics Automator

Transforms a `#flightanchor` event into a full itinerary with high-contrast color coding.

---

## 🚀 The Entry System
To trigger the script, create a calendar event with this specific format:
* **Title:** `ORD to DEN at Gate B12 #flightanchor`
* **Location:** `ORD`

The script appends `#flightmanaged` to all logistics content for tracking.

---

## 🛠️ Features
* 🔴 **Red Anchor:** Original flight is set to Tomato color.
* 🟢 **Green Logistics:** Uber, Security, Club, and Boarding set to Basil color.
* **Smart Routing:** Finds United Club near your specified gate (ORD/DEN).
* **Weather Integration:** Packing tasks include destination temp in Celsius.
* **Self-Healing:** Alerts you via Google Tasks if new airport data is required.

---

## ⚙️ Setup
1. Copy `Code.gs` to [script.google.com](https://script.google.com).
2. Enable **Google Tasks API** under Services.
3. Set a **30-minute timer** trigger for `automateFlightEvents`.
