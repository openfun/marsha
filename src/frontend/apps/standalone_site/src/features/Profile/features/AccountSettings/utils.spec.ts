import { isError } from './utils';

describe('Account settings utils', () => {
  describe('isError', () => {
    it('returns true with an appropriate error', () => {
      expect(isError({})).toBe(true);
      expect(isError({ old_password: ['some error'] })).toBe(true);
      expect(isError({ new_password1: ['some error'] })).toBe(true);
      expect(isError({ new_password2: ['some error'] })).toBe(true);
      expect(
        isError({
          old_password: ['some error'],
          new_password1: ['some error'],
          new_password2: ['some error'],
        }),
      ).toBe(true);
    });

    it('returns false with inapropriate error', () => {
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
      expect(isError({ new_password1: 'some error' })).toBe(false);
      expect(isError({ new_password1: 0 })).toBe(false);
      expect(
        isError({ new_password1: ['some error'], new_password2: 'some error' }),
      ).toBe(false);
    });
  });
});
