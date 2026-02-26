/**
 * Flight Logistics Automator 
 * Final Fix: Brute-force Color IDs (11 = Red, 6 = Green).
 */

function automateFlightEvents() {
  const calendar = CalendarApp.getDefaultCalendar();
  const now = new Date();
  const searchPeriod = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
  
  const events = calendar.getEvents(now, searchPeriod, {search: '#flightanchor'});
  
  events.forEach(flight => {
    const fullTitle = flight.getTitle();
    const cleanTitle = fullTitle.split(" at ")[0].replace('#flightanchor', '').trim();
    const startTime = flight.getStartTime();
    const endTime = flight.getEndTime();
    const description = flight.getDescription() || "";
    
    const rawLoc = flight.getLocation() || "";
    const airportCode = rawLoc.substring(0, 3).toUpperCase().trim(); 

    let gateStr = "";
    if (fullTitle.toLowerCase().includes("at gate")) {
      const parts = fullTitle.split(/at gate/i);
      gateStr = parts[1].replace('#flightanchor', '').trim();
    }
    const gateInfo = gateStr ? ` Gate ${gateStr.toUpperCase()}` : "";

    let clubLocation = "United Club"; 
    let needsUpdate = false;
    if (!["ORD", "DEN"].includes(airportCode)) { needsUpdate = true; }

    if (gateStr && airportCode === "ORD") {
      const gateNum = parseInt(gateStr.replace(/\D/g, "")); 
      const gateLetter = gateStr.charAt(0).toUpperCase();
      if (gateLetter === "B") {
        clubLocation = (gateNum <= 10) ? "United Club near B6" : "United Club near B18";
      } else if (gateLetter === "C") {
        clubLocation = "United Club near C10";
      }
    } else if (gateStr && airportCode === "DEN") {
      const gateLetter = gateStr.charAt(0).toUpperCase();
      clubLocation = (gateLetter === "B") ? "United Club near B44" : "United Club near A26";
    }

    // SYNC LOGIC
    if (description.includes("#flightmanaged")) {
      const existingSubEvents = calendar.getEvents(new Date(startTime.getTime() - (5 * 60 * 60000)), new Date(endTime.getTime() + (5 * 60 * 60000)), {search: "#flightmanaged"});
      existingSubEvents.forEach(e => e.deleteEvent());
    }

    // TIMELINE CONFIGURATION
    const timeline = [
      { mins: 60,  dur: 60, name: `Board ${cleanTitle} at${gateInfo} ` }, 
      { mins: 75,  dur: 15, name: `Walk to Gate${gateInfo} ` },                 
      { mins: 90,  dur: 15, name: `${clubLocation} at ` }, 
      { mins: 105, dur: 15, name: `Walk to ${clubLocation} at ` }, 
      { mins: 120, dur: 15, name: `Security at ${airportCode} ` },    
      { mins: 180, dur: 30, name: `Reserved Uber to ${airportCode} ` } 
    ];

    timeline.forEach(item => {
      const eventTime = new Date(startTime.getTime() - (item.mins * 60000));
      const endEventTime = new Date(eventTime.getTime() + (item.dur * 60000));
      const newEvent = calendar.createEvent(item.name + "#flightmanaged", eventTime, endEventTime);
      
      // FORCING GREEN (BASIL)
      newEvent.setColor(CalendarApp.EventColor.BASIL); 
    });

    const postFlightUber = calendar.createEvent(`Reserved Uber to #flightmanaged`, endTime, new Date(endTime.getTime() + (30 * 60000)));
    postFlightUber.setColor(CalendarApp.EventColor.BASIL);

    // TASKS
    const taskDueTime = new Date(startTime.getTime() - (24 * 60 * 60 * 1000)).toISOString();
    try {
      Tasks.Tasks.insert({title: `Check in for ${cleanTitle} #flightmanaged`, due: taskDueTime}, "@default");
      Tasks.Tasks.insert({title: `Pack for ${cleanTitle} #flightmanaged`, due: taskDueTime}, "@default");
      if (needsUpdate) {
        Tasks.Tasks.insert({title: `🛠️ UPDATE SCRIPT: Add ${airportCode} #flightmanaged`, due: taskDueTime}, "@default");
      }
    } catch (e) {}

    if (!flight.getDescription().includes("#flightmanaged")) {
      flight.setDescription(flight.getDescription() + "\n\n#flightmanaged");
    }
    
    // FORCING RED (TOMATO)
    flight.setColor(CalendarApp.EventColor.TOMATO); 
  });
}
