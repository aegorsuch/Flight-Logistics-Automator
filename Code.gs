/**
 * Flight Logistics Automator (Quota-Friendly Version)
 * Status: Uber events removed. 7-day Ground Transport Task added.
 * Logic: Updates existing events; creates tasks for booking.
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

    // Define the desired timeline (Removed Reserved Uber entries)
    var timeline = [
      { mins: 60,  dur: 60, name: "Board " + cleanTitle }, 
      { mins: 75,  dur: 15, name: "Walk to Gate" },                 
      { mins: 90,  dur: 15, name: clubName }, 
      { mins: 120, dur: 15, name: "Security at " + airportCode }
    ];

    // Get current managed events for this window
    var syncStart = new Date(startTime.getTime() - (6 * 60 * 60000));
    var syncEnd = new Date(endTime.getTime() + (2 * 60 * 60000));
    var currentManaged = calendar.getEvents(syncStart, syncEnd, {search: "#flightmanaged"});

    // Cleanup: If there are old "Reserved Uber" calendar events, delete them
    currentManaged.forEach(function(e) {
      if (e.getTitle().indexOf("Reserved Uber") !== -1) {
        e.deleteEvent();
      }
    });

    timeline.forEach(function(item) {
      var desiredStart = new Date(startTime.getTime() - (item.mins * 60000));
      var desiredEnd = new Date(desiredStart.getTime() + (item.dur * 60000));
      
      var existing = currentManaged.find(e => e.getTitle().includes(item.name));

      if (existing) {
        if (existing.getStartTime().getTime() !== desiredStart.getTime()) {
          existing.setTime(desiredStart, desiredEnd);
        }
        if (fullAddress && existing.getLocation() !== fullAddress) {
          existing.setLocation(fullAddress);
        }
      } else {
        var newEvent = calendar.createEvent(item.name + " #flightmanaged", desiredStart, desiredEnd);
        if (fullAddress) newEvent.setLocation(fullAddress);
      }
    });

    // --- PART 2: TASK GENERATION ---
    if (flight.getDescription().indexOf("#flightmanaged") === -1) {
      var oneDayBefore = new Date(startTime.getTime() - (24 * 60 * 60 * 1000));
      var sevenDaysBefore = new Date(startTime.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      try {
        // Task 1: Book Ground Transport (Uber/Rental) - 7 Days Before
        Tasks.Tasks.insert({
          title: "Book Ground Transportation for " + cleanTitle + " #flightmanaged", 
          due: sevenDaysBefore.toISOString()
        }, "@default");

        // Task 2: Check in - 24 Hours Before
        Tasks.Tasks.insert({
          title: "Check in: " + cleanTitle + " #flightmanaged", 
          due: oneDayBefore.toISOString()
        }, "@default");

        // Mark flight as "processed" via the description
        flight.setDescription(flight.getDescription() + "\n\n#flightmanaged");
      } catch (e) {
        Logger.log("Task creation failed: " + e.message);
      }
    }
  });
}
