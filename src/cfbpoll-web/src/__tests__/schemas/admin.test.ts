import { describe, it, expect } from 'vitest';
import {
  CalculateResponseSchema,
  LoginResponseSchema,
  PersistedWeekSchema,
  PersistedWeeksResponseSchema,
} from '../../schemas/admin';

describe('Admin schemas', () => {
  describe('LoginResponseSchema', () => {
    it('validates a valid login response', () => {
      const data = { token: 'jwt-token-here', expiresIn: 28800 };
      const result = LoginResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.token).toBe('jwt-token-here');
        expect(result.data.expiresIn).toBe(28800);
      }
    });

    it('rejects missing token', () => {
      const data = { expiresIn: 28800 };
      const result = LoginResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing expiresIn', () => {
      const data = { token: 'jwt-token-here' };
      const result = LoginResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('CalculateResponseSchema', () => {
    it('validates a valid calculate response', () => {
      const data = {
        persisted: true,
        rankings: {
          season: 2024,
          week: 5,
          rankings: [],
        },
      };
      const result = CalculateResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing persisted field', () => {
      const data = {
        rankings: { season: 2024, week: 5, rankings: [] },
      };
      const result = CalculateResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('PersistedWeekSchema', () => {
    it('validates a valid persisted week', () => {
      const data = {
        season: 2024,
        week: 5,
        published: true,
        createdAt: '2024-11-01T12:00:00Z',
      };
      const result = PersistedWeekSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing published field', () => {
      const data = {
        season: 2024,
        week: 5,
        createdAt: '2024-11-01T12:00:00Z',
      };
      const result = PersistedWeekSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('PersistedWeeksResponseSchema', () => {
    it('validates an array of persisted weeks', () => {
      const data = [
        { season: 2024, week: 1, published: true, createdAt: '2024-09-01T12:00:00Z' },
        { season: 2024, week: 2, published: false, createdAt: '2024-09-08T12:00:00Z' },
      ];
      const result = PersistedWeeksResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('validates an empty array', () => {
      const result = PersistedWeeksResponseSchema.safeParse([]);
      expect(result.success).toBe(true);
    });

    it('rejects non-array input', () => {
      const result = PersistedWeeksResponseSchema.safeParse({ weeks: [] });
      expect(result.success).toBe(false);
    });
  });
});
