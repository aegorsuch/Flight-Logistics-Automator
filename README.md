# ✈️ Calendar and Task Flight Automations

A Google Apps Script (GAS) utility that transforms a single `#flight` calendar entry into a comprehensive, color-coded travel itinerary. It automatically generates logistical sub-events and synchronized Google Tasks for a seamless travel experience on your phone and **Galaxy Watch Ultra**.

---

## 🚀 How It Works
When you add a flight to your calendar with the `#flight` tag (e.g., `1700-1900 DEN to ORD #flight`), this script triggers to build your entire "travel path" backward from your departure time.

### **1. Automated Itinerary (Calendar)**
The script creates a sequence of 15-minute logistical blocks leading up to your flight:
* **NEEDS Reserved Uber:** 150 mins before departure.
* **Security at [Airport]:** 120 mins before departure.
* **Walk to United Club:** 105 mins before departure.
* **United Club:** 90 mins before departure.
* **Walk to Gate:** 75 mins before departure.
* **Boarding:** 60 mins before departure.

### **2. Pre-Flight Reminders (Google Tasks)**
Exactly **24 hours** before your flight, the script injects two tasks into your default Google Tasks list:
* ✅ **Check in for [Flight]** (includes departure time in notes).
* 📦 **Pack for [Flight]**

### **3. Visual Organization**
All generated events and the original flight are color-coded **Basil (Green)**. This creates a distinct "Green Trail" on your Wear OS watch face, separating travel logistics from your standard work meetings.

---

## 🛠️ Setup Instructions

### **Step 1: Create the Script**
1. Go to [script.google.com](https://script.google.com).
2. Click **New Project** and rename it to `Calendar and Task Flight Automations`.
3. Delete any existing code and paste the contents of `Code.gs` from this repository.

### **Step 2: Enable Services**
1. In the left sidebar, click the **+** next to **Services**.
2. Find **Google Tasks API** in the list and click **Add**.

### **Step 3: Set the Automation Trigger**
1. Click the **Triggers** icon (the clock ⏰) on the left sidebar.
2. Click **+ Add Trigger** in the bottom right.
   * **Function to run:** `automateFlightEvents`
   * **Event source:** `Time-driven`
   * **Type
