import { paginated } from './paginated.js';

describe('paginated', () => {
  it('wraps data with page, limit and total', () => {
    expect(paginated(['a', 'b'], 7, { page: 2, limit: 2 })).toEqual({
      data: ['a', 'b'],
      meta: { page: 2, limit: 2, total: 7 },
    });
  });
});
