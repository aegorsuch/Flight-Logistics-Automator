/**
 * Flight Logistics Automator 
 * Logic: Parses Gate from Title ("at Gate B12"), Airport from Location ("ORD").
 * Colors: Anchor = TOMATO (11), Logistics = BASIL (6).
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
    const airportCode = flight.getLocation() ? flight.getLocation().toUpperCase().trim() : ""; 

    let gateStr = "";
    if (fullTitle.toLowerCase().includes("at gate")) {
      const parts = fullTitle.split(/at gate/i);
      gateStr = parts[1].replace('#flightanchor', '').trim();
    }
    const gateInfo = gateStr ? ` Gate ${gateStr.toUpperCase()}` : "";

    let clubLocation = "United Club"; 
    let needsUpdate = false;
    const supportedClubHubs = ["ORD", "DEN"];
    
    if (!supportedClubHubs.includes(airportCode)) { needsUpdate = true; }

    if (gateStr) {
      const gateNum = parseInt(gateStr.replace(/\D/g, "")); 
      const gateLetter = gateStr.charAt(0).toUpperCase();

      if (airportCode === "ORD") {
        if (gateLetter === "B") {
          clubLocation = (gateNum <= 10) ? "United Club near B6" : "United Club near B18";
        } else if (gateLetter === "C") {
          clubLocation = "United Club near C10";
        }
      } else if (airportCode === "DEN") {
        clubLocation = (gateLetter === "B") ? "United Club near B44" : "United Club near A26";
      }
    }

    if (description.includes("#flightmanaged")) {
      const existingSubEvents = calendar.getEvents(new Date(startTime.getTime() - (24 * 60 * 60000)), new Date(endTime.getTime() + (24 * 60 * 60000)), {search: cleanTitle + " #flightmanaged"});
      const expectedBoardingTime = new Date(startTime.getTime() - (60 * 60000));
      
      const needsSync = existingSubEvents.some(e => 
        (e.getStartTime().getTime() !== expectedBoardingTime.getTime()) ||
        (gateStr !== "" && !e.getTitle().includes(gateInfo))
      );

      if (needsSync) {
        existingSubEvents.forEach(e => e.deleteEvent());
        try {
          const defaultListId = "@default";
          const existingTasks = Tasks.Tasks.list(defaultListId).items || [];
          existingTasks.forEach(t => {
            if (t.title.includes(cleanTitle) && t.title.includes("#flightmanaged")) {
              Tasks.Tasks.remove(defaultListId, t.id);
            }
          });
        } catch (e) { console.log("Task removal error"); }
        flight.setDescription(description.replace("#flightmanaged", "").trim());
      } else { return; }
    }

    let weatherNote = "";
    const dest = cleanTitle.split(" to ")[1]?.substring(0, 3).toUpperCase();
    const geo = { 
      "DAY": {lat: 39.9, lon: -84.2}, "ORD": {lat: 41.9, lon: -87.9}, 
      "DEN": {lat: 39.8, lon: -104.6}, "DCA": {lat: 38.8, lon: -77.0},
      "LAS": {lat: 36.1, lon: -115.1}, "VPS": {lat: 30.4, lon: -86.5},
      "ADW": {lat: 38.8, lon: -76.8}, "GRK": {lat: 31.0, lon: -97.8}
    };

    if (!geo[dest]) { needsUpdate = true; }

    try {
      const coord = geo[dest];
      if (coord) {
        const res = UrlFetchApp.fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lon}&daily=weather_code,temperature_2m_max&timezone=auto&forecast_days=14`);
        const data = JSON.parse(res.getContentText());
        const arrivalDate = endTime.toISOString().split('T')[0];
        const idx = data.daily.time.indexOf(arrivalDate);
        if (idx !== -1) {
          const temp = Math.round(data.daily.temperature_2m_max[idx]);
          weatherNote = ` (${dest}: ${temp}°C, ${data.daily.weather_code[idx] > 50 ? "Rain" : "Clear"})`;
        }
      }
    } catch (e) {}

    const timeline = [
      { mins: 60,  name: `Board ${cleanTitle} at${gateInfo} ` },
      { mins: 75,  name: `Walk to Gate${gateInfo} ` },                 
      { mins: 90,  name: `${clubLocation} at ` }, 
      { mins: 105, name: `Walk to ${clubLocation} at ` }, 
      { mins: 120, name: `Security at ${airportCode} ` },    
      { mins: 150, name: `Reserved Uber to ${airportCode} ` } 
    ];

    timeline.forEach(item => {
      const eventTime = new Date(startTime.getTime() - (item.mins * 60000));
      const newEvent = calendar.createEvent(item.name + "#flightmanaged", eventTime, new Date(eventTime.getTime() + (15 * 60000)));
      newEvent.setColor("6"); 
    });

    const postFlightUber = calendar.createEvent("Reserved Uber to #flightmanaged", endTime, new Date(endTime.getTime() + (30 * 60000)));
    postFlightUber.setColor("6"); 

    const due = new Date(startTime.getTime() - (24 * 60 * 60 * 1000)).toISOString();
    try {
      Tasks.Tasks.insert({title: `Check in for ${cleanTitle} #flightmanaged`, due: due}, "@default");
      Tasks.Tasks.insert({title: `Pack for ${cleanTitle}${weatherNote} #flightmanaged`, due: due}, "@default");
      if (needsUpdate) {
        Tasks.Tasks.insert({title: `🛠️ UPDATE SCRIPT: Add ${airportCode}/${dest} #flightmanaged`, notes: `Update geo/club objects in Code.gs`, due: due}, "@default");
      }
    } catch (e) {}

    if (!flight.getDescription().includes("#flightmanaged")) {
      flight.setDescription(flight.getDescription() + "\n\n#flightmanaged");
    }
    flight.setColor("11"); 
  });
}
