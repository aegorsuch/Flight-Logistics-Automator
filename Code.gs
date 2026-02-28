/**
 * Flight Logistics Automator (Quota-Friendly Version)
 * Status: Optimized to prevent "Service invoked too many times" errors.
 * Logic: Updates existing events instead of deleting/recreating every minute.
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
      clubName = (gateID.charAt(0) === "B") ? ((gateNum <= 10) ? "United Club near B6" : "United Club near B18") : "United Club near C10";
    }

    // Define the desired timeline
    var timeline = [
      { mins: 60,  dur: 60, name: "Board " + cleanTitle }, 
      { mins: 75,  dur: 15, name: "Walk to Gate" },                 
      { mins: 90,  dur: 15, name: clubName }, 
      { mins: 120, dur: 15, name: "Security at " + airportCode },    
      { mins: 150, dur: 30, name: "Reserved Uber to " + airportCode } 
    ];

    // Get current managed events for this window
    var syncStart = new Date(startTime.getTime() - (6 * 60 * 60000));
    var syncEnd = new Date(endTime.getTime() + (2 * 60 * 60000));
    var currentManaged = calendar.getEvents(syncStart, syncEnd, {search: "#flightmanaged"});

    timeline.forEach(function(item) {
      var desiredStart = new Date(startTime.getTime() - (item.mins * 60000));
      var desiredEnd = new Date(desiredStart.getTime() + (item.dur * 60000));
      
      // Look for an existing event with this name
      var existing = currentManaged.find(e => e.getTitle().includes(item.name));

      if (existing) {
        // Only update if the time has actually changed (Saves Quota!)
        if (existing.getStartTime().getTime() !== desiredStart.getTime()) {
          existing.setTime(desiredStart, desiredEnd);
        }
        if (fullAddress && existing.getLocation() !== fullAddress) {
          existing.setLocation(fullAddress);
        }
      } else {
        // Create only if missing
        var newEvent = calendar.createEvent(item.name + " #flightmanaged", desiredStart, desiredEnd);
        if (fullAddress) newEvent.setLocation(fullAddress);
      }
    });

    // Handle Destination Uber similarly
    var destUberName = "Reserved Uber to " + (cleanTitle.split(" to ")[1] || "").substring(0,3).toUpperCase();
    var existingDestUber = currentManaged.find(e => e.getTitle().includes("Reserved Uber") && e.getStartTime().getTime() >= endTime.getTime());
    if (!existingDestUber) {
       calendar.createEvent(destUberName + " #flightmanaged", endTime, new Date(endTime.getTime() + (30 * 60000)));
    }

    // --- PART 2: TASK GENERATION (Only if not flagged) ---
    if (flight.getDescription().indexOf("#flightmanaged") === -1) {
      var taskDate = new Date(startTime.getTime() - (24 * 60 * 60 * 1000));
      try {
        Tasks.Tasks.insert({title: "Reserve Uber to " + airportCode + " #flightmanaged", due: taskDate.toISOString()}, "@default");
        Tasks.Tasks.insert({title: "Check in: " + cleanTitle + " #flightmanaged", due: taskDate.toISOString()}, "@default");
        flight.setDescription(flight.getDescription() + "\n\n#flightmanaged");
      } catch (e) {}
    }
  });
}
