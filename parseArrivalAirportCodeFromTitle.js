// Extracts the arrival airport code from a flight title string.
// E.g., "ORD to DEN" => "DEN"
function parseArrivalAirportCodeFromTitle_(title) {
  var normalized = (title || "")
    .replace(/#flightanchor/gi, "")
    .replace(/^\s*Board\s+/i, "")
    .toUpperCase();

  // Priority 1: route format like "ORD to DEN" or "ORD->DEN".
  var routeMatch = /\b([A-Z]{3})\s*(?:TO|->|-)\s*([A-Z]{3})\b/.exec(normalized);
  if (routeMatch) {
    return routeMatch[2];
  }

  // Priority 2: if only one code, return it (fallback)
  var codeMatch = /([A-Z]{3})\b/.exec(normalized);
  return codeMatch ? codeMatch[1] : "";
}
