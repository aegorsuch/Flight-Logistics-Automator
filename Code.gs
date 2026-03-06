/**
 * Flight Logistics Generator (Final Gapless Version)
 * Logic: Creates the timeline ONCE per flight.
 * Features: 15m Security, 15m Walks, 30m Club, 45m Boarding.
 */

function FlightLogisticsAutomator() {
  var calendar = CalendarApp.getDefaultCalendar();
  var now = new Date();
  var searchPeriod = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));

  var flightAnchors = calendar.getEvents(now, searchPeriod, {search: '#flightanchor'});

  flightAnchors.forEach(function(flight) {
    // If the description already has the tag, the script ignores this flight.
    if (flight.getDescription().indexOf("#flightmanaged") !== -1) {
      return;
    }

    var originalTitle = flight.getTitle();
    var cleanTitle = originalTitle.replace('#flightanchor', '').replace('Board ', '').split(' at ')[0].trim();
    var startTime = flight.getStartTime();
    var fullAddress = flight.getLocation() || "";
    var airportCode = cleanTitle.substring(0, 3).toUpperCase();

    // The Final Gapless Template
    var timeline = [
      { mins: 45,  dur: 45, name: "Board " + cleanTitle + " at Gate GATE" },
      { mins: 60,  dur: 15, name: "Walk to Gate GATE" },
      { mins: 90,  dur: 30, name: "United Club near Gate GATE" },
      { mins: 105, dur: 15, name: "Walk to United Club near Gate GATE" },
      { mins: 120, dur: 15, name: "Security at " + airportCode }
    ];

    timeline.forEach(function(item) {
      var eventStart = new Date(startTime.getTime() - (item.mins * 60000));
      var eventEnd = new Date(eventStart.getTime() + (item.dur * 60000));
      var newEvent = calendar.createEvent(item.name + " #flightmanaged", eventStart, eventEnd);
      if (fullAddress) newEvent.setLocation(fullAddress);
    });

    // --- TASK GENERATION ---
    var oneDayBefore = new Date(startTime.getTime() - (24 * 60 * 60 * 1000));
    var sevenDaysBefore = new Date(startTime.getTime() - (7 * 24 * 60 * 60 * 1000));

    try {
      Tasks.Tasks.insert({title: "Book Ground Transportation for " + cleanTitle + " #flightmanaged", due: sevenDaysBefore.toISOString()}, "@default");
      Tasks.Tasks.insert({title: "Check in for " + cleanTitle + " #flightmanaged", due: oneDayBefore.toISOString()}, "@default");
      Tasks.Tasks.insert({title: "Pack for " + cleanTitle + " #flightmanaged", due: oneDayBefore.toISOString()}, "@default");

      // Mark as "Managed" so the script never touches this flight again.
      flight.setDescription(flight.getDescription() + "\n\n#flightmanaged");
    } catch (e) {
      Logger.log("Task creation failed: " + e.message);
    }
  });
}
