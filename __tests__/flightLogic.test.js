const { parseGateFromTitle_ } = require('../flightUtils');

test('parseGateFromTitle_ extracts gate', () => {
  expect(parseGateFromTitle_('ORD to DEN at Gate B12 #flightanchor')).toBe('B12');
  expect(parseGateFromTitle_('DEN to SFO at Gate A26 #flightanchor')).toBe('A26');
  expect(parseGateFromTitle_('No gate info')).toBe('');
});
