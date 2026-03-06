// Pure utility functions for Node.js testing

function parseGateFromTitle_(title) {
  const match = /\bat\s+gate\s+([A-Z0-9-]+)/i.exec(title || "");
  return match ? match[1].toUpperCase() : "";
}

module.exports = {
  parseGateFromTitle_,
};
