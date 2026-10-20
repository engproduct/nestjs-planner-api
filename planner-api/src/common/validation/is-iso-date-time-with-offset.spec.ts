import { isIsoDateTimeWithOffset } from './is-iso-date-time-with-offset.js';

describe('isIsoDateTimeWithOffset', () => {
  it.each([
    '2026-10-20T13:00:00Z',
    '2026-10-20T10:00:00-03:00',
    '2026-10-20T10:00+05:30',
    '2026-10-20T10:00:00.123Z',
    '2028-02-29T10:00:00Z',
  ])('accepts %s', (value) => {
    expect(isIsoDateTimeWithOffset(value)).toBe(true);
  });

  it.each([
    '2026-10-20T13:00:00',
    '2026-10-20',
    '2026-10-20T13:00:00+0300',
    '2026-10-20T13:00:00z',
    '2026-02-30T10:00:00Z',
    '2027-02-29T10:00:00Z',
    '2026-10-20T24:00:00Z',
    '2026-10-20T13:60:00Z',
    '2026-10-20T13:00:00.1234Z',
    '2026-10-20T13:00:00+03:60',
    1792501200000,
    null,
  ])('rejects %j', (value) => {
    expect(isIsoDateTimeWithOffset(value)).toBe(false);
  });
});
