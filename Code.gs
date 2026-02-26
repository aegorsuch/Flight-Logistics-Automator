function automateFlightEvents() {
  const calendar = CalendarApp.getDefaultCalendar();
  const now = new Date();
  const searchPeriod = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
  
  const events = calendar.getEvents(now, searchPeriod, {search: '#flight'});
  
  events.forEach(flight => {
    const fullTitle = flight.getTitle();
    const cleanTitle = fullTitle.replace('#flight', '').trim();
    const startTime = flight.getStartTime();
    const description = flight.getDescription() || "";
    const flightLocation = flight.getLocation();
    
    // Safety check: skip if already processed
    if (description.includes("PROCESSED_BY_SCRIPT")) return;

    // Extract Airport Code (e.g., "DEN" from "DEN to ORD")
    const airportCode = cleanTitle.substring(0, 3).toUpperCase();

    // 1. CREATE ITINERARY EVENTS (Green/Basil)
    const timeline = [
      { mins: 60,  name: "Board " + cleanTitle },
      { mins: 75,  name: "Walk to Gate" },
      { mins: 90,  name: "United Club" },
      { mins: 105, name: "Walk to United Club" },
      { mins: 120, name: "Security at " + airportCode },
      { mins: 150, name: "NEEDS Reserved Uber to " + airportCode }
    ];

    timeline.forEach(item => {
      const eventTime = new Date(startTime.getTime() - (item.mins * 60000));
      const newEvent = calendar.createEvent(item.name, eventTime, new Date(eventTime.getTime() + (15 * 60000)));
      
      newEvent.setLocation(flightLocation);
      newEvent.setDescription("Auto-generated from flight: " + cleanTitle);
      newEvent.setColor(CalendarApp.EventColor.BASIL); // Green
    });

    // 2. CREATE GOOGLE TASKS (Both 24h Before)
    try {
      const twentyFourHoursBefore = new Date(startTime.getTime() - (24 * 60 * 60 * 1000)).toISOString();
      
      // Task 1: Check-in
      Tasks.Tasks.insert({
        title: "Check in for " + cleanTitle,
        notes: "Departure: " + startTime.toLocaleTimeString(),
        due: twentyFourHoursBefore
      }, "@default");

      // Task 2: Pack
      Tasks.Tasks.insert({
        title: "Pack for " + cleanTitle,
        due: twentyFourHoursBefore
      }, "@default");

      console.log("24h Tasks created for: " + cleanTitle);
    } catch (e) {
      console.log("Task creation failed. Ensure Tasks API is enabled in Services: " + e.message);
    }

    // 3. MARK FLIGHT AS PROCESSED
    flight.setDescription(description + "\n\nPROCESSED_BY_SCRIPT");
    flight.setColor(CalendarApp.EventColor.BASIL); // Make the main flight green too!
  });
}
