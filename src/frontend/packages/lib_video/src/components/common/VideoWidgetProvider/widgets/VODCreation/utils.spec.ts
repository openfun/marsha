import { liveState } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';

import { shouldDisplayDefaultMessage } from './utils';

const targetLiveStates = [liveState.STOPPED, liveState.HARVESTED];

describe('shouldDisplayDefaultMessage', () => {
  it('returns true if live_state is not liveState.STOPPED and live_state is not liveState.HARVESTED', () => {
    const values = Object.values(liveState).filter(
      (value) => !targetLiveStates.includes(value),
    );

    values.forEach((value) => {
      const video = videoMockFactory({
        live_state: value,
      });

      expect(shouldDisplayDefaultMessage(video)).toBe(true);
    });
  });

  it('returns true if recording_time is undefined', () => {
    targetLiveStates.forEach((value) => {
      const video = videoMockFactory({
        live_state: value,
        recording_time: undefined,
      });

      expect(shouldDisplayDefaultMessage(video)).toBe(true);
    });
  });

  it('returns true if recording_time is less or equal 0', () => {
    targetLiveStates.forEach((value) => {
      const video = videoMockFactory({
        live_state: value,
        recording_time: 0,
      });

      expect(shouldDisplayDefaultMessage(video)).toBe(true);
    });

    targetLiveStates.forEach((value) => {
      const video = videoMockFactory({
        live_state: value,
        recording_time: -2,
      });

      expect(shouldDisplayDefaultMessage(video)).toBe(true);
    });
  });

  it('returns false', () => {
    targetLiveStates.forEach((value) => {
      const video = videoMockFactory({
        live_state: value,
        recording_time: 10,
      });

      expect(shouldDisplayDefaultMessage(video)).toBe(false);
    });
  });
});
