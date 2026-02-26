# ✈️ Flight Logistics Automator

A Google Apps Script utility that turns a single `#flightanchor` event into a full itinerary with intelligent routing and high-contrast color coding.

---

## 🚀 The Hashtag System
1.  **`#flightanchor`**: Add to your flight (e.g., `ORD to DAY #flightanchor`).
2.  **`#flightmanaged`**: Appended to all sub-events/tasks for tracking.

---

## 🛠️ Features

### **1. Visual Traffic-Light System**
* 🔴 **Tomato (Red):** The anchor flight you cannot miss.
* 🟢 **Basil (Green):** All logistics (Uber, Security, Club, Boarding).

### **2. Smart Club Routing**
Enter your **Gate** (e.g., `B18`) in the flight's **Location** field. The script:
* Updates all walking/boarding titles with the gate.
* Finds the nearest United Club (ORD/DEN) and names it: `Walk to United Club near B18`.

### **3. Weather & Military Support**
Fetches 14-day forecasts (Celsius) for major hubs and military airports (DAY, VPS, ADW, etc.).

### **4. Self-Healing Tasks**
If data for an airport is missing, the script creates a task: `🛠️ UPDATE SCRIPT: Add JFK/LHR`.

---

## ⚙️ Setup Instructions
1.  **Copy Script:** Paste `Code.gs` into [script.google.com](https://script.google.com).
2.  **Enable API:** Add the **Google Tasks API** service.
3.  **Set Trigger:** Set `automateFlightEvents` to run on a **Minutes timer (Every 30 minutes)**.

## ⚖️ License
Distributed under the **MIT License**.
