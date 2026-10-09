import { isBirthDateInFuture, normalizeEmail } from './patient.rules.js';

describe('patient rules', () => {
  const today = new Date('2026-10-09T12:00:00Z');

  describe('isBirthDateInFuture', () => {
    it('is false for a past date', () => {
      expect(isBirthDateInFuture('1990-05-20', today)).toBe(false);
    });

    it('is false for today', () => {
      expect(isBirthDateInFuture('2026-10-09', today)).toBe(false);
    });

    it('is true for a later date', () => {
      expect(isBirthDateInFuture('2026-10-10', today)).toBe(true);
    });
  });

  describe('normalizeEmail', () => {
    it('trims and lowercases', () => {
      expect(normalizeEmail('  Foo@X.com ')).toBe('foo@x.com');
    });
  });
});
