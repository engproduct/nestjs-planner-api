import { envFilePaths, resolveAppEnv, validateEnv } from './env.js';

const validRaw = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'api_user',
  DB_PASSWORD: 'api_pass',
  DB_NAME: 'planner_db',
  DB_SCHEMA: 'public',
};

describe('resolveAppEnv', () => {
  it('defaults to development when APP_ENV is absent', () => {
    expect(resolveAppEnv(undefined)).toBe('development');
  });

  it.each(['development', 'test', 'staging', 'production'])(
    'accepts %s',
    (appEnv) => {
      expect(resolveAppEnv(appEnv)).toBe(appEnv);
    },
  );

  it('rejects a value outside the enum', () => {
    expect(() => resolveAppEnv('qa')).toThrow(/APP_ENV/);
  });
});

describe('envFilePaths', () => {
  it('loads local, environment and default files in development', () => {
    expect(envFilePaths('development')).toEqual([
      '.env.development.local',
      '.env.development',
      '.env',
    ]);
  });

  it('loads only .env.test* in test, without falling back to .env', () => {
    expect(envFilePaths('test')).toEqual(['.env.test.local', '.env.test']);
  });

  it.each(['staging', 'production'] as const)(
    'loads no file in %s',
    (appEnv) => {
      expect(envFilePaths(appEnv)).toEqual([]);
    },
  );
});

describe('validateEnv', () => {
  it('returns typed values', () => {
    const env = validateEnv({ ...validRaw, APP_ENV: 'test', PORT: '4000' });

    expect(env).toMatchObject({
      APP_ENV: 'test',
      PORT: 4000,
      DB_PORT: 5432,
      DB_USER: 'api_user',
    });
  });

  it('defaults APP_ENV to development and PORT to 3000', () => {
    const env = validateEnv(validRaw);

    expect(env.APP_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
  });

  it('rejects APP_ENV outside the enum', () => {
    expect(() => validateEnv({ ...validRaw, APP_ENV: 'qa' })).toThrow(
      /APP_ENV/,
    );
  });

  it.each(['PORT', 'DB_PORT'])('rejects a non-numeric %s', (key) => {
    expect(() => validateEnv({ ...validRaw, [key]: 'abc' })).toThrow(
      new RegExp(key),
    );
  });

  it.each([
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_SCHEMA',
  ])('requires %s', (key) => {
    const raw: Record<string, string> = { ...validRaw };
    delete raw[key];

    expect(() => validateEnv(raw)).toThrow(new RegExp(key));
  });

  it('rejects an empty DB_PASSWORD', () => {
    expect(() => validateEnv({ ...validRaw, DB_PASSWORD: '' })).toThrow(
      /DB_PASSWORD/,
    );
  });

  it.each([
    ['development', true],
    ['test', true],
    ['staging', true],
    ['production', false],
  ])('defaults SWAGGER_ENABLED in %s to %s', (appEnv, expected) => {
    expect(validateEnv({ ...validRaw, APP_ENV: appEnv }).SWAGGER_ENABLED).toBe(
      expected,
    );
  });

  it('lets SWAGGER_ENABLED override the APP_ENV default', () => {
    const env = validateEnv({
      ...validRaw,
      APP_ENV: 'production',
      SWAGGER_ENABLED: 'true',
    });

    expect(env.SWAGGER_ENABLED).toBe(true);
  });

  it('rejects SWAGGER_ENABLED other than true/false', () => {
    expect(() => validateEnv({ ...validRaw, SWAGGER_ENABLED: 'yes' })).toThrow(
      /SWAGGER_ENABLED/,
    );
  });
});
