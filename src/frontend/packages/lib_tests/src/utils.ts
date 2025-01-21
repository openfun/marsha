import { act } from 'react-dom/test-utils';

export const advanceJestTimersByTime = (
  incrementMs: number,
  iterations: number,
) => {
  for (let i = 0; i < iterations; i++) {
    act(() => {
      jest.advanceTimersByTime(incrementMs);
    });
  }
};
