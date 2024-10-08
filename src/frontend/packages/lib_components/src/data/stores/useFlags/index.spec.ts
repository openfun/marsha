import { flags } from '@lib-components/types';

import { useFlags } from '.';

describe('useFlags', () => {
  it('initializes with default flags', () => {
    expect(useFlags.getState().flags).toEqual({
      classroom: false,
      deposit: false,
      markdown: false,
      video: false,
      webinar: false,
      document: false,
      sentry: false,
      live_raw: false,
      transcription: false,
    });

    useFlags.getState().setFlags({ classroom: true, video: true });

    expect(useFlags.getState().flags).toEqual({
      classroom: true,
      deposit: false,
      markdown: false,
      video: true,
      webinar: false,
      document: false,
      sentry: false,
      live_raw: false,
      transcription: false,
    });

    expect(useFlags.getState().isFlagEnabled(flags.CLASSROOM)).toBe(true);
    expect(useFlags.getState().isFlagEnabled(flags.VIDEO)).toBe(true);
    expect(useFlags.getState().isFlagEnabled(flags.DOCUMENT)).toBe(false);
  });
});
