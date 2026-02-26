/**
 * Flight Logistics Automator 
 * Status: Calendar (Update/Sync) + Tasks (Add-Only).
 * Features: 2.5hr Uber, 1hr Boarding, Full Address Sync, 24h Precise Tasks.
 */

function automateFlightEvents() {
  var calendar = CalendarApp.getDefaultCalendar();
  var now = new Date();
  var searchPeriod = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
  
  // --- PART 1: AUTO-CLEANUP ORPHANED CALENDAR EVENTS ---
  var allManaged = calendar.getEvents(now, searchPeriod, {search: '#flightmanaged'});
  allManaged.forEach(function(managedEvent) {
    var startTime = managedEvent.getStartTime();
    var searchStart = new Date(startTime.getTime() - (6 * 60 * 60000));
    var searchEnd = new Date(startTime.getTime() + (6 * 60 * 60000));
    var anchors = calendar.getEvents(searchStart, searchEnd, {search: '#flightanchor'});
    if (anchors.length === 0) {
      managedEvent.deleteEvent();
    }
  });

  // --- PART 2: GENERATE/UPDATE LOGISTICS ---
  var flightAnchors = calendar.getEvents(now, searchPeriod, {search: '#flightanchor'});
  
  flightAnchors.forEach(function(flight) {
    var fullTitle = flight.getTitle();
    var cleanTitle = fullTitle.split(" at ")[0].replace('#flightanchor', '').trim();
    var startTime = flight.getStartTime();
    var endTime = flight.getEndTime();
    var fullAddress = flight.getLocation() || "";
    var airportCode = cleanTitle.substring(0, 3).toUpperCase();

    var gateID = "";
    if (fullTitle.toLowerCase().indexOf("at gate") !== -1) {
      var parts = fullTitle.split(/at gate/i);
      gateID = parts[1].replace('#flightanchor', '').trim().toUpperCase();
    }

    var clubLocation = "United Club"; 
    if (gateID && airportCode === "ORD") {
      var gateNum = parseInt(gateID.replace(/\D/g, "")); 
      var gateLetter = gateID.charAt(0);
      if (gateLetter === "B") {
        clubLocation = (gateNum <= 10) ? "United Club near B6" : "United Club near B18";
      } else if (gateLetter === "C") {
        clubLocation = "United Club near C10";
      }
    } else if (gateID && airportCode === "DEN") {
      var denGateLetter = gateID.charAt(0);
      clubLocation = (denGateLetter === "B") ? "United Club near B44" : "United Club near A26";
    }

    // Standard cleanup for the calendar events for this specific flight
    var syncStart = new Date(startTime.getTime() - (6 * 60 * 60000));
    var syncEnd = new Date(endTime.getTime() + (2 * 60 * 60000));
    var currentManaged = calendar.getEvents(syncStart, syncEnd, {search: "#flightmanaged"});
    currentManaged.forEach(function(e) { e.deleteEvent(); });

    // TIMELINE CONFIGURATION
    var timeline = [
      { mins: 60,  dur: 60, name: "Board " + cleanTitle + (gateID ? " Gate " + gateID : "") }, 
      { mins: 75,  dur: 15, name: "Walk to " + (gateID ? "Gate " + gateID : "Gate") },                 
      { mins: 90,  dur: 15, name: clubLocation }, 
      { mins: 105, dur: 15, name: "Walk to " + clubLocation }, 
      { mins: 120, dur: 15, name: "Security at " + airportCode },    
      { mins: 150, dur: 30, name: "Reserved Uber to " + airportCode } 
    ];

    timeline.forEach(function(item) {
      var eventTime = new Date(startTime.getTime() - (item.mins * 60000));
      var endEventTime = new Date(eventTime.getTime() + (item.dur * 60000));
      var newEvent = calendar.createEvent(item.name + " #flightmanaged", eventTime, endEventTime);
      if (fullAddress) { newEvent.setLocation(fullAddress); }
    });

    var postFlightUber = calendar.createEvent("Reserved Uber to #flightmanaged", endTime, new Date(endTime.getTime() + (30 * 60000)));

    // --- PART 3: TASK GENERATION (ADD-ONLY) ---
    // This only creates tasks if the flight doesn't have the #flightmanaged tag in its description yet.
    if (flight.getDescription().indexOf("#flightmanaged") === -1) {
      var taskDate = new Date(startTime.getTime() - (24 * 60 * 60 * 1000));
      var taskDueTime = taskDate.toISOString(); 
      
      try {
        Tasks.Tasks.insert({title: "Check in for " + cleanTitle + " #flightmanaged", due: taskDueTime}, "@default");
        Tasks.Tasks.insert({title: "Pack for " + cleanTitle + " #flightmanaged", due: taskDueTime}, "@default");
        
        // Mark the anchor so we don't create duplicate tasks next time
        flight.setDescription(flight.getDescription() + "\n\n#flightmanaged");
      } catch (e) {
        Logger.log("Task creation failed: " + e.message);
      }
    }
  });
}
