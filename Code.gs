/**
 * Flight Logistics Generator (Final Gapless Version)
 * Logic: Idempotent sync of timeline and tasks for #flightanchor events.
 * Features: Locking, gate parsing, event upserts, and duplicate-safe task creation.
 */

var CLEANUP_ORPHAN_MANAGED_EVENTS = true;
var SEARCH_AHEAD_DAYS = 14;
var CLEANUP_LOOKBACK_DAYS = 2;

function FlightLogisticsAutomator() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log("Another run is in progress; exiting this invocation.");
    return;
  }

  try {
    var calendar = CalendarApp.getDefaultCalendar();
    var now = new Date();
    var searchPeriod = new Date(now.getTime() + (SEARCH_AHEAD_DAYS * 24 * 60 * 60 * 1000));
    var flightAnchors = calendar.getEvents(now, searchPeriod, {search: '#flightanchor'});
    var openTaskTitles = getOpenTaskTitleSet_();
    var liveAnchorTags = {};

    flightAnchors.forEach(function(flight) {
      try {
        var originalTitle = flight.getTitle() || "";
        var anchorId = buildAnchorId_(flight);
        var anchorTag = "#anchor:" + anchorId;
        liveAnchorTags[anchorTag] = true;
        var taskToken = "[A:" + anchorId + "]";
        var parsedGate = parseGateFromTitle_(originalTitle);
        var cleanTitle = originalTitle
          .replace(/#flightanchor/gi, "")
          .replace(/^\s*Board\s+/i, "")
          .replace(/\s+at\s+gate\s+[A-Z0-9-]+/i, "")
          .trim();

        var startTime = flight.getStartTime();
        var endTime = flight.getEndTime();
        var fullAddress = flight.getLocation() || "";
        var airportCode = parseAirportCodeFromTitle_(originalTitle) || "AIR";

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
          var desiredTitle = item.name + " #flightmanaged #" + item.key + " " + anchorTag;
          var matched = findManagedMatches_(managedEvents, item.key, anchorTag, desiredStart);
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
        ensureTask_(openTaskTitles, "Book Ground Transportation for " + cleanTitle + " " + taskToken + " #flightmanaged " + anchorTag, sevenDaysBefore);
        ensureTask_(openTaskTitles, "Check in for " + cleanTitle + " " + taskToken + " #flightmanaged " + anchorTag, oneDayBefore);
        ensureTask_(openTaskTitles, "Pack for " + cleanTitle + " " + taskToken + " #flightmanaged " + anchorTag, oneDayBefore);

        var description = flight.getDescription() || "";
        if (description.indexOf("#flightmanaged") === -1) {
          flight.setDescription((description + "\n\n#flightmanaged").trim());
        }
      } catch (flightErr) {
        Logger.log("Failed to process anchor '" + flight.getTitle() + "': " + flightErr.message);
      }
    });

    if (CLEANUP_ORPHAN_MANAGED_EVENTS) {
      cleanupOrphanManagedEvents_(calendar, now, searchPeriod, liveAnchorTags);
    }
  } finally {
    lock.releaseLock();
  }
}

function cleanupOrphanManagedEvents_(calendar, now, searchPeriod, liveAnchorTags) {
  var cleanupStart = new Date(now.getTime() - (CLEANUP_LOOKBACK_DAYS * 24 * 60 * 60 * 1000));
  var managedEvents = calendar.getEvents(cleanupStart, searchPeriod, {search: "#flightmanaged"});
  var deletedCount = 0;

  managedEvents.forEach(function(event) {
    var title = event.getTitle() || "";
    var tagMatch = /#anchor:([a-z0-9]+)/i.exec(title);
    if (!tagMatch) {
      return;
    }

    var anchorTag = "#anchor:" + tagMatch[1].toLowerCase();
    if (liveAnchorTags[anchorTag]) {
      return;
    }

    try {
      event.deleteEvent();
      deletedCount++;
    } catch (cleanupErr) {
      Logger.log("Failed to delete orphan managed event: " + cleanupErr.message);
    }
  });

  if (deletedCount > 0) {
    Logger.log("Deleted orphan managed events: " + deletedCount);
  }
}

function parseGateFromTitle_(title) {
  var match = /\bat\s+gate\s+([A-Z0-9-]+)/i.exec(title || "");
  return match ? match[1].toUpperCase() : "";
}

function parseAirportCodeFromTitle_(title) {
  var normalized = (title || "")
    .replace(/#flightanchor/gi, "")
    .replace(/^\s*Board\s+/i, "")
    .toUpperCase();

  // Priority 1: route format like "ORD to DEN" or "ORD->DEN".
  var routeMatch = /\b([A-Z]{3})\s*(?:TO|->|-)\s*([A-Z]{3})\b/.exec(normalized);
  if (routeMatch) {
    return routeMatch[1];
  }

  // Priority 2: title starts with IATA code.
  var leadingCode = /^\s*([A-Z]{3})\b/.exec(normalized);
  if (leadingCode) {
    return leadingCode[1];
  }

  // Priority 3: first IATA-like token anywhere in title.
  var tokenMatch = /\b([A-Z]{3})\b/.exec(normalized);
  return tokenMatch ? tokenMatch[1] : "";
}

function buildAnchorId_(flight) {
  var raw = "";

  try {
    raw = flight.getId();
  } catch (idErr) {
    raw = "";
  }

  if (!raw) {
    raw = (flight.getTitle() || "") + "|" + flight.getStartTime().toISOString();
  }

  var anchorId = raw.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
  return anchorId ? anchorId.substring(0, 20) : "unknownanchor";
}

function eventMatchesLegacyKey_(title, key) {
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
}

function findManagedMatches_(events, key, anchorTag, desiredStart) {
  var anchorScoped = events.filter(function(event) {
    var title = event.getTitle() || "";
    return title.indexOf(anchorTag) !== -1 && (title.indexOf("#" + key) !== -1 || eventMatchesLegacyKey_(title, key));
  });

  if (anchorScoped.length) {
    return anchorScoped;
  }

  // Migration path for legacy events without anchor tags, kept strict with time matching.
  return events.filter(function(event) {
    var title = event.getTitle() || "";
    if (title.indexOf("#anchor:") !== -1) {
      return false;
    }

    if (!eventMatchesLegacyKey_(title, key)) {
      return false;
    }

    var startDeltaMs = Math.abs(event.getStartTime().getTime() - desiredStart.getTime());
    return startDeltaMs <= 30 * 60000;
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
