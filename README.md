# ✈️ Flight Logistics Automator

**Flight Logistics Automator** transforms `#flightanchor` events into a full travel itinerary. By parsing the airport from the **Location** and the gate from the **Title**, it generates color-coded logistics—Uber, security, and gate-specific United Club routing—complete with weather-aware packing tasks in Celsius.

[Image of Google Calendar showing a red flight event and a timeline of green logistical events including travel and airport tasks]

---

## 🚀 Usage

To trigger the automation, create a calendar event with this specific format:

* **Title:** `ORD to DEN at Gate B12 #flightanchor`
* **Location:** `ORD` (Always use the departing airport code here)

The script will automatically append `#flightmanaged` to all generated events and tasks to handle synchronization and prevent duplicates.

---

## 🛠️ Features

* **Visual Traffic-Light System:**
    * 🔴 **Tomato (Color ID 11):** Your original anchor flight.
    * 🟢 **Basil (Color ID 6):** All generated logistics (Uber, Security, Club, Boarding).
* **Smart Club Routing:** Automatically finds the nearest United Club based on your gate (supported at ORD and DEN).
* **Weather Integration:** Injects destination temperature (Celsius) and conditions into your "Pack" task.
* **Self-Healing Database:** Generates a Google Task (`🛠️ UPDATE SCRIPT`) if you fly to an airport not in the script's database.
* **30-
