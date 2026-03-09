// Pure utility functions for Node.js testing

function parseGateFromTitleNode(title) {
	const match = /\bat\s+gate\s+([A-Z0-9-]+)/i.exec(title || "");
	return match ? match[1].toUpperCase() : "";
}

// ...existing code...
// Pure utility functions for Node.js testing


// ...existing code...
