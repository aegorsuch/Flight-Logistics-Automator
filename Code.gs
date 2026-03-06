/**
 * Flight Logistics Generator (Final Gapless Version)
 * Logic: Idempotent sync of timeline and tasks for #flightanchor events.
 * Features: Locking, gate parsing, event upserts, and duplicate-safe task creation.
 */

function FlightLogisticsAutomator() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log("Another run is in progress; exiting this invocation.");
    return;
  }

  try {
    var calendar = CalendarApp.getDefaultCalendar();
    var now = new Date();
    var searchPeriod = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
    var flightAnchors = calendar.getEvents(now, searchPeriod, {search: '#flightanchor'});
    var openTaskTitles = getOpenTaskTitleSet_();

    flightAnchors.forEach(function(flight) {
      try {
        var originalTitle = flight.getTitle() || "";
        var parsedGate = parseGateFromTitle_(originalTitle);
        var cleanTitle = originalTitle
          .replace(/#flightanchor/gi, "")
          .replace(/^\s*Board\s+/i, "")
          .replace(/\s+at\s+gate\s+[A-Z0-9-]+/i, "")
          .trim();

        var startTime = flight.getStartTime();
        var endTime = flight.getEndTime();
        var fullAddress = flight.getLocation() || "";
        var airportCode = cleanTitle.substring(0, 3).toUpperCase();

        var boardTitle = parsedGate ? ("Board " + cleanTitle + " at Gate " + parsedGate) : ("Board " + cleanTitle);
        var walkGateTitle = parsedGate ? ("Walk to Gate " + parsedGate) : "Walk to Gate";
        var clubTitle = parsedGate ? ("United Club near Gate " + parsedGate) : "United Club";
        var walkClubTitle = parsedGate ? ("Walk to United Club near Gate " + parsedGate) : "Walk to United Club";

        var timeline = [
          { key: "fm-board", mins: 45, dur: 45, name: boardTitle },
          { key: "fm-walk-gate", mins: 60, dur: 15, name: walkGateTitle },
          { key: "fm-club", mins: 90, dur: 30, name: clubTitle },
          { key: "fm-walk-club", mins: 105, dur: 15, name: walkClubTitle },
          { key: "fm-security", mins: 120, dur: 15, name: "Security at " + airportCode }
        ];

        var syncStart = new Date(startTime.getTime() - (6 * 60 * 60000));
        var syncEnd = new Date(endTime.getTime() + (2 * 60 * 60000));
        var managedEvents = calendar.getEvents(syncStart, syncEnd, {search: "#flightmanaged"});

        timeline.forEach(function(item) {
          var desiredStart = new Date(startTime.getTime() - (item.mins * 60000));
          var desiredEnd = new Date(desiredStart.getTime() + (item.dur * 60000));
          var desiredTitle = item.name + " #flightmanaged #" + item.key;
          var matched = findManagedMatches_(managedEvents, item.key);
          var eventToKeep = matched.length ? matched[0] : null;

          // Remove duplicates from prior runs so each step has one managed event.
          if (matched.length > 1) {
            for (var i = 1; i < matched.length; i++) {
              try {
                matched[i].deleteEvent();
              } catch (duplicateErr) {
                Logger.log("Failed to remove duplicate event: " + duplicateErr.message);
              }
            }
          }

          if (eventToKeep) {
            eventToKeep.setTitle(desiredTitle);
            eventToKeep.setTime(desiredStart, desiredEnd);
            if (fullAddress && eventToKeep.getLocation() !== fullAddress) {
              eventToKeep.setLocation(fullAddress);
            }
          } else {
            var created = calendar.createEvent(desiredTitle, desiredStart, desiredEnd);
            if (fullAddress) {
              created.setLocation(fullAddress);
            }
          }
        });

        var oneDayBefore = new Date(startTime.getTime() - (24 * 60 * 60 * 1000));
        var sevenDaysBefore = new Date(startTime.getTime() - (7 * 24 * 60 * 60 * 1000));
        ensureTask_(openTaskTitles, "Book Ground Transportation for " + cleanTitle + " #flightmanaged", sevenDaysBefore);
        ensureTask_(openTaskTitles, "Check in for " + cleanTitle + " #flightmanaged", oneDayBefore);
        ensureTask_(openTaskTitles, "Pack for " + cleanTitle + " #flightmanaged", oneDayBefore);

        var description = flight.getDescription() || "";
        if (description.indexOf("#flightmanaged") === -1) {
          flight.setDescription((description + "\n\n#flightmanaged").trim());
        }
      } catch (flightErr) {
        Logger.log("Failed to process anchor '" + flight.getTitle() + "': " + flightErr.message);
      }
    });
  } finally {
    lock.releaseLock();
  }
}

function parseGateFromTitle_(title) {
  var match = /\bat\s+gate\s+([A-Z0-9-]+)/i.exec(title || "");
  return match ? match[1].toUpperCase() : "";
}

function findManagedMatches_(events, key) {
  return events.filter(function(event) {
    var title = event.getTitle() || "";
    if (title.indexOf("#" + key) !== -1) {
      return true;
    }

    switch (key) {
      case "fm-board":
        return /^Board\s/i.test(title);
      case "fm-walk-gate":
        return /^Walk to Gate\b/i.test(title);
      case "fm-club":
        return /^United Club\b/i.test(title);
      case "fm-walk-club":
        return /^Walk to United Club\b/i.test(title);
      case "fm-security":
        return /^Security at\s/i.test(title);
      default:
        return false;
    }
  });
}

function getOpenTaskTitleSet_() {
  var seen = {};
  var pageToken;

  do {
    var response = Tasks.Tasks.list("@default", {
      showCompleted: false,
      showHidden: false,
      maxResults: 100,
      pageToken: pageToken
    });

    var items = (response && response.items) ? response.items : [];
    items.forEach(function(item) {
      if (item && item.title) {
        seen[item.title] = true;
      }
    });

    pageToken = response ? response.nextPageToken : null;
  } while (pageToken);

  return seen;
}

function ensureTask_(taskTitleSet, title, dueDate) {
  if (taskTitleSet[title]) {
    return;
  }

  try {
    Tasks.Tasks.insert({title: title, due: dueDate.toISOString()}, "@default");
    taskTitleSet[title] = true;
  } catch (taskErr) {
    Logger.log("Task sync failed for '" + title + "': " + taskErr.message);
  }
}
