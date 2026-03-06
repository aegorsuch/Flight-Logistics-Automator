/**
 * Flight Logistics Generator (Final Gapless Version)
 * Logic: Idempotent sync of timeline and tasks for #flightanchor events.
 * Features: Locking, gate parsing, event upserts, and duplicate-safe task creation.
 */


var FLIGHT_LOGISTICS_CONFIG = {
  CLEANUP_ORPHAN_MANAGED_EVENTS: true,
  SEARCH_AHEAD_DAYS: 14,
  CLEANUP_LOOKBACK_DAYS: 2,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  ERROR_EMAIL: Session.getActiveUser().getEmail(),
  ERROR_TASK_LIST: "@default"
};

function FlightLogisticsAutomator() {
  runFlightLogistics_({dryRun: false, config: FLIGHT_LOGISTICS_CONFIG});
}

function DryRunFlightLogistics() {
  runFlightLogistics_({dryRun: true});
}

function TestFlightLogisticsHarness() {
  var testAnchors = [
    {
      title: "ORD to DEN at Gate B12 #flightanchor",
      location: "Chicago O'Hare",
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)
    },
    {
      title: "DEN to SFO at Gate A26 #flightanchor",
      location: "Denver International",
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)
    }
  ];
  Logger.log("TEST HARNESS: Simulating anchor events...");
  testAnchors.forEach(function(anchor) {
    Logger.log("TEST HARNESS: Processing " + anchor.title);
    // Simulate processing logic
    var valid = validateAnchorEvent_(anchor);
    if (!valid) {
      Logger.log("TEST HARNESS: Invalid anchor event: " + anchor.title);
    } else {
      Logger.log("TEST HARNESS: Valid anchor event: " + anchor.title);
    }
  });
}

function runFlightLogistics_(options) {
  var dryRun = !!(options && options.dryRun);
  var config = (options && options.config) ? options.config : FLIGHT_LOGISTICS_CONFIG;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log((dryRun ? "DRY RUN" : "LIVE") + ": another run is in progress; exiting this invocation.");
    return;
  }
      QUOTA_ALERT_THRESHOLD: 0.9 // Alert when 90% of quota is used

  try {
    Logger.log((dryRun ? "DRY RUN" : "LIVE") + ": starting FlightLogisticsAutomator run.");
      monitorApiQuota_(FLIGHT_LOGISTICS_CONFIG);
    var now = new Date();
    var searchPeriod = new Date(now.getTime() + (SEARCH_AHEAD_DAYS * 24 * 60 * 60 * 1000));
    var flightAnchors = calendar.getEvents(now, searchPeriod, {search: '#flightanchor'});
    var openTaskTitles = getOpenTaskTitleSet_();
      monitorApiQuota_(FLIGHT_LOGISTICS_CONFIG);

    flightAnchors.forEach(function(flight) {
      try {
    // API quota monitoring
    function monitorApiQuota_(config) {
      try {
        var calendarQuota = getCalendarApiQuota_();
        var tasksQuota = getTasksApiQuota_();
        var threshold = config.QUOTA_ALERT_THRESHOLD || 0.9;
        if (calendarQuota.used / calendarQuota.limit >= threshold) {
          reportError_("Calendar API quota nearly exhausted: " + calendarQuota.used + "/" + calendarQuota.limit, config);
        }
        if (tasksQuota.used / tasksQuota.limit >= threshold) {
          reportError_("Tasks API quota nearly exhausted: " + tasksQuota.used + "/" + tasksQuota.limit, config);
        }
      } catch (quotaErr) {
        Logger.log("Failed to monitor API quota: " + quotaErr.message);
      }
    }

    // Dummy quota fetchers (replace with real API if available)
    function getCalendarApiQuota_() {
      // Google Apps Script does not expose quota directly; simulate for demo
      // Replace with real quota fetch if available
      return {used: 900, limit: 1000}; // Example: 900/1000 used
    }

    function getTasksApiQuota_() {
      // Google Apps Script does not expose quota directly; simulate for demo
      // Replace with real quota fetch if available
      return {used: 450, limit: 500}; // Example: 450/500 used
    }
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
                if (dryRun) {
                  Logger.log("DRY RUN: would delete duplicate managed event: " + (matched[i].getTitle() || "(untitled)"));
                } else {
                  matched[i].deleteEvent();
                }
              } catch (duplicateErr) {
                Logger.log("Failed to remove duplicate event: " + duplicateErr.message);
              }
            }
          }

          if (eventToKeep) {
            if (dryRun) {
              Logger.log("DRY RUN: would update managed event to '" + desiredTitle + "' at " + desiredStart.toISOString());
            } else {
              eventToKeep.setTitle(desiredTitle);
              eventToKeep.setTime(desiredStart, desiredEnd);
              if (fullAddress && eventToKeep.getLocation() !== fullAddress) {
                eventToKeep.setLocation(fullAddress);
              }
            }
          } else {
            if (dryRun) {
              Logger.log("DRY RUN: would create managed event '" + desiredTitle + "' at " + desiredStart.toISOString());
            } else {
              var created = calendar.createEvent(desiredTitle, desiredStart, desiredEnd);
              if (fullAddress) {
                created.setLocation(fullAddress);
              }
            }
          }
        });

        var oneDayBefore = new Date(startTime.getTime() - (24 * 60 * 60 * 1000));
        var sevenDaysBefore = new Date(startTime.getTime() - (7 * 24 * 60 * 60 * 1000));
        ensureTask_(openTaskTitles, "Book Ground Transportation for " + cleanTitle + " " + taskToken + " #flightmanaged " + anchorTag, sevenDaysBefore, options);
        ensureTask_(openTaskTitles, "Check in for " + cleanTitle + " " + taskToken + " #flightmanaged " + anchorTag, oneDayBefore, options);
        ensureTask_(openTaskTitles, "Pack for " + cleanTitle + " " + taskToken + " #flightmanaged " + anchorTag, oneDayBefore, options);

        var description = flight.getDescription() || "";
        if (description.indexOf("#flightmanaged") === -1) {
          if (dryRun) {
            Logger.log("DRY RUN: would append #flightmanaged tag to anchor description.");
          } else {
            flight.setDescription((description + "\n\n#flightmanaged").trim());
          }
        }
      } catch (flightErr) {
        Logger.log("Failed to process anchor '" + flight.getTitle() + "': " + flightErr.message);
      }
    });

    if (CLEANUP_ORPHAN_MANAGED_EVENTS) {
      cleanupOrphanManagedEvents_(calendar, now, searchPeriod, liveAnchorTags, options);
    }

    Logger.log((dryRun ? "DRY RUN" : "LIVE") + ": run completed.");
  } finally {
    lock.releaseLock();
  }
}

function cleanupOrphanManagedEvents_(calendar, now, searchPeriod, liveAnchorTags, options) {
  var dryRun = !!(options && options.dryRun);
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
      if (dryRun) {
        Logger.log("DRY RUN: would delete orphan managed event: " + title);
      } else {
        event.deleteEvent();
      }
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

function ensureTask_(taskTitleSet, title, dueDate, options) {
  var dryRun = !!(options && options.dryRun);
  if (taskTitleSet[title]) {
    return;
  }

  try {
    if (dryRun) {
      Logger.log("DRY RUN: would create task '" + title + "' due " + dueDate.toISOString());
    } else {
      Tasks.Tasks.insert({title: title, due: dueDate.toISOString()}, "@default");
    }
    taskTitleSet[title] = true;
  } catch (taskErr) {
    Logger.log("Task sync failed for '" + title + "': " + taskErr.message);
  }
}

function validateAnchorEvent_(event) {
  var title = event.title || "";
  var location = event.location || "";
  var gate = event.gate || "";
  if (!title.match(/#flightanchor/i)) return false;
  if (!location || location.length < 3) return false;
  if (!gate || gate.length < 1) return false;
  return true;
}

function retryApiCall_(fn, config) {
  var maxRetries = config.MAX_RETRIES || 3;
  var delayMs = config.RETRY_DELAY_MS || 2000;
  for (var i = 0; i < maxRetries; i++) {
    try {
      return fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      Utilities.sleep(delayMs);
    }
  }
}

function reportError_(msg, config) {
  Logger.log("ERROR: " + msg);
  try {
    // Send email alert
    if (config.ERROR_EMAIL) {
      MailApp.sendEmail(config.ERROR_EMAIL, "Flight Logistics Automator Error", msg);
    }
    // Create special error task
    if (config.ERROR_TASK_LIST) {
      Tasks.Tasks.insert({title: "[FLA ERROR] " + msg, due: new Date().toISOString()}, config.ERROR_TASK_LIST);
    }
  } catch (alertErr) {
    Logger.log("ERROR: Failed to send alert: " + alertErr.message);
  }
}
