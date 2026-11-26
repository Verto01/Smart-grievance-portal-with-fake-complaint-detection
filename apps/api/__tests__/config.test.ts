import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

const validEnv = {
  MONGO_URI: 'mongodb://localhost:27017/test',
  JWT_ACCESS_SECRET: 'test-access-secret-long-enough',
  JWT_REFRESH_SECRET: 'test-refresh-secret-long-enough',
  SESSION_VERIFY_SECRET: 'test-session-verify-secret',
  SSE_TICKET_SECRET: 'test-sse-ticket-secret-long',
};

describe('loadConfig', () => {
  it('loads valid configuration with defaults', () => {
    const config = loadConfig(validEnv);
    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(4000);
    expect(config.AI_PROVIDER).toBe('mock');
    expect(config.DUP_RADIUS_M).toBe(150);
  });

  it('throws on missing MONGO_URI', () => {
    expect(() => loadConfig({ ...validEnv, MONGO_URI: '' })).toThrow();
  });

  it('throws on missing JWT secrets', () => {
    const { JWT_ACCESS_SECRET: _, ...noSecret } = validEnv;
    expect(() => loadConfig(noSecret)).toThrow('JWT_ACCESS_SECRET');
  });

  it('reads a readable error on malformed env', () => {
    try {
      loadConfig({});
      expect.unreachable('should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain('Invalid environment configuration');
      expect(msg).toContain('MONGO_URI');
    }
  });
});

describe('RUN_WORKER configuration', () => {
  it.each([
    { value: 'true', expected: true },
    { value: 'false', expected: false },
    { value: '1', expected: true },
    { value: '0', expected: false },
  ])('parses $value as $expected', ({ value, expected }) => {
    const config = loadConfig({
      ...validEnv,
      RUN_WORKER: value,
    });

    expect(config.RUN_WORKER).toBe(expected);
  });

  it('disables the worker by default', () => {
    expect(loadConfig(validEnv).RUN_WORKER).toBe(false);
  });

  it.each(['invalid', '', 'yes'])(
    'rejects invalid worker value "%s"',
    (value) => {
      expect(() =>
        loadConfig({ ...validEnv, RUN_WORKER: value })
      ).toThrow('RUN_WORKER');
    }
  );
});
