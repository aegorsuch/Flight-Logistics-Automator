const { parseGateFromTitleNode } = require('../flightUtils');

test('parseGateFromTitleNode extracts gate', () => {
  expect(parseGateFromTitleNode('ORD to DEN at Gate B12 #flightanchor')).toBe('B12');
  expect(parseGateFromTitleNode('DEN to SFO at Gate A26 #flightanchor')).toBe('A26');
  expect(parseGateFromTitleNode('No gate info')).toBe('');
});
