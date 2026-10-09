import { buildDatabaseUrl } from './database-url.js';

const database = {
  DB_HOST: 'localhost',
  DB_PORT: 5433,
  DB_USER: 'api_user_test',
  DB_PASSWORD: 'api_pass_test',
  DB_NAME: 'planner_db_test',
  DB_SCHEMA: 'public',
};

describe('buildDatabaseUrl', () => {
  it('builds a PostgreSQL URL with the schema', () => {
    expect(buildDatabaseUrl(database)).toBe(
      'postgresql://api_user_test:api_pass_test@localhost:5433/planner_db_test?schema=public',
    );
  });

  it('URL-encodes user and password', () => {
    const url = buildDatabaseUrl({
      ...database,
      DB_USER: 'user@clinic',
      DB_PASSWORD: 'p@ss:w/rd#?%',
    });

    expect(url).toBe(
      'postgresql://user%40clinic:p%40ss%3Aw%2Frd%23%3F%25@localhost:5433/planner_db_test?schema=public',
    );
    expect(decodeURIComponent(new URL(url).password)).toBe('p@ss:w/rd#?%');
  });
});
