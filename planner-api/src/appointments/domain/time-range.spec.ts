import { DomainError } from '../../common/domain/domain-error.js';
import { TimeRange } from './time-range.js';

describe('TimeRange', () => {
  const start = new Date('2026-10-20T13:00:00Z');
  const end = new Date('2026-10-20T14:00:00Z');

  it('creates a range when start < end', () => {
    const range = TimeRange.create(start, end);

    expect(range.start).toEqual(start);
    expect(range.end).toEqual(end);
  });

  it('I1: throws a DomainError when start > end', () => {
    expect(() => TimeRange.create(end, start)).toThrow(DomainError);
  });

  it('I1: throws a DomainError when start == end', () => {
    expect(() => TimeRange.create(start, new Date(start))).toThrow(DomainError);
  });

  it('throws a DomainError for an invalid date', () => {
    expect(() => TimeRange.create(new Date('invalid'), end)).toThrow(
      DomainError,
    );
  });

  it('is immutable: mutating inputs or returned dates does not affect it', () => {
    const input = new Date(start);
    const range = TimeRange.create(input, end);

    input.setUTCFullYear(2000);
    range.start.setUTCFullYear(2000);

    expect(range.start).toEqual(start);
  });
});
