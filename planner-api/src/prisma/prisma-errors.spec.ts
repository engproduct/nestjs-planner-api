import { isNotFound, isUniqueViolation } from './prisma-errors.js';

describe('isUniqueViolation', () => {
  it('is true for Prisma error code P2002', () => {
    expect(isUniqueViolation({ code: 'P2002' })).toBe(true);
  });

  it('is false for other codes and non-objects', () => {
    expect(isUniqueViolation({ code: 'P2025' })).toBe(false);
    expect(isUniqueViolation(new Error('x'))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation('P2002')).toBe(false);
  });
});

describe('isNotFound', () => {
  it('is true for Prisma error code P2025', () => {
    expect(isNotFound({ code: 'P2025' })).toBe(true);
  });

  it('is false for other codes and non-objects', () => {
    expect(isNotFound({ code: 'P2002' })).toBe(false);
    expect(isNotFound(new Error('x'))).toBe(false);
    expect(isNotFound(null)).toBe(false);
    expect(isNotFound('P2025')).toBe(false);
  });
});
