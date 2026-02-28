/**
 * Flight Logistics Automator (Quota-Friendly Version)
 * Status: Uber/Ground Transport events removed from Calendar.
 * Logic: Updates existing air logistics; creates a 7-day task for ground booking.
 */

function FlightLogisticsAutomator() {
  var calendar = CalendarApp.getDefaultCalendar();
  var now = new Date();
  var searchPeriod = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
  
  // --- PART 1: GENERATE/UPDATE LOGISTICS ---
  var flightAnchors = calendar.getEvents(now, searchPeriod, {search: '#flightanchor'});
  
  flightAnchors.forEach(function(flight) {
    var originalTitle = flight.getTitle();
    var cleanTitle = originalTitle.replace('#flightanchor', '').replace('Board ', '').split(' at ')[0].trim();
    var startTime = flight.getStartTime();
    var endTime = flight.getEndTime();
    var fullAddress = flight.getLocation() || "";
    var airportCode = cleanTitle.substring(0, 3).toUpperCase();

    // United Club Smart Logic
    var clubName = "United Club";
    var gateID = (originalTitle.toLowerCase().indexOf("at gate") !== -1) ? originalTitle.toLowerCase().split("at gate")[1].trim().toUpperCase() : "";
    if (gateID && airportCode === "ORD") {
      var gateNum = parseInt(gateID.replace(/\D/g, "")); 
      var gateLetter = gateID.charAt(0);
      clubName = (gateLetter === "B") ? ((gateNum <= 10) ? "United Club near B6" : "United Club near B18") : "United Club near C10";
    } else if (gateID && airportCode === "DEN") {
      clubName = (gateID.charAt(0) === "B") ? "United Club near B44" : "United Club near A26";
    }

    // Define the desired timeline (Air logistics only)
    var timeline = [
      { mins: 45,  dur: 45, name: "Board " + cleanTitle }, // Starts 45m before, ends at departure
      { mins: 60,  dur: 15, name: "Walk to Gate" },         // 15m walk to arrive for boarding
      { mins: 90,  dur: 30, name: clubName },               // 30m in the Club
      { mins: 105,  dur: 15, name: "Walk to United Club" },               // 15m to United Club      
      { mins: 120, dur: 15, name: "Security at " + airportCode } // 15m for Security/Transit
    ];

    // Get current managed events for this window
    var syncStart = new Date(startTime.getTime() - (6 * 60 * 60000));
    var syncEnd = new Date(endTime.getTime() + (2 * 60 * 60000));
    var currentManaged = calendar.getEvents(syncStart, syncEnd, {search: "#flightmanaged"});

    timeline.forEach(function(item) {
      var desiredStart = new Date(startTime.getTime() - (item.mins * 60000));
      var desiredEnd = new Date(desiredStart.getTime() + (item.dur * 60000));
      
      var existing = currentManaged.find(e => e.getTitle().includes(item.name));

      if (existing) {
        // Sync time if it changed
        if (existing.getStartTime().getTime() !== desiredStart.getTime()) {
          existing.setTime(desiredStart, desiredEnd);
        }
        // Sync location if it changed
        if (fullAddress && existing.getLocation() !== fullAddress) {
          existing.setLocation(fullAddress);
        }
      } else {
        // Create only if missing
        var newEvent = calendar.createEvent(item.name + " #flightmanaged", desiredStart, desiredEnd);
        if (fullAddress) newEvent.setLocation(fullAddress);
      }
    });

    // --- PART 2: TASK GENERATION ---
    if (flight.getDescription().indexOf("#flightmanaged") === -1) {
      var oneDayBefore = new Date(startTime.getTime() - (24 * 60 * 60 * 1000));
      var sevenDaysBefore = new Date(startTime.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      try {
        // Task 1: Ground Transport - 7 Days Before
        Tasks.Tasks.insert({
          title: "Book Ground Transportation for " + cleanTitle + " #flightmanaged", 
          due: sevenDaysBefore.toISOString()
        }, "@default");

        // Task 2: Check in - 24 Hours Before
        Tasks.Tasks.insert({
          title: "Check in for " + cleanTitle + " #flightmanaged", 
          due: oneDayBefore.toISOString()
        }, "@default");

        // Mark as processed
        flight.setDescription(flight.getDescription() + "\n\n#flightmanaged");
      } catch (e) {
        Logger.log("Task creation failed: " + e.message);
      }
    }
  });
}
