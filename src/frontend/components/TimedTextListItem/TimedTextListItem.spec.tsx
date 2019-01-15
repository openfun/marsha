import { flushAllPromises } from '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

const mockDeleteTimedTextTrack = jest.fn();
jest.doMock(
  '../../data/sideEffects/deleteTimedTextTrack/deleteTimedTextTrack',
  () => ({ deleteTimedTextTrack: mockDeleteTimedTextTrack }),
);

const mockGetTimedTextTrackLanguageChoices = jest.fn();
jest.doMock(
  '../../data/sideEffects/getTimedTextTrackLanguageChoices/getTimedTextTrackLanguageChoices',
  () => ({
    getTimedTextTrackLanguageChoices: mockGetTimedTextTrackLanguageChoices,
  }),
);

jest.doMock('react-router-dom', () => ({
  Link: () => null,
}));

import { TimedText, uploadState } from '../../types/tracks';
import { TimedTextListItem } from './TimedTextListItem';

describe('<TimedTextListItem />', () => {
  const mockDeleteTimedTextTrackRecord = jest.fn();

  it('renders a track, showing its language and status', async () => {
    mockGetTimedTextTrackLanguageChoices.mockReturnValue(
      Promise.resolve([{ label: 'French', value: 'fr' }]),
    );

    const wrapper = shallow(
      <TimedTextListItem
        deleteTimedTextTrackRecord={mockDeleteTimedTextTrackRecord}
        jwt={'some token'}
        track={
          {
            is_ready_to_play: true,
            language: 'fr',
            upload_state: uploadState.READY,
          } as TimedText
        }
      />,
    );

    await flushAllPromises();

    expect(wrapper.html()).toContain('French');
    expect(wrapper.html()).toContain('Ready');
  });

  describe('deleteTimedTextTrack()', () => {
    it('issues a deleteTimedTextTrack request and deletes the track from the store', async () => {
      mockDeleteTimedTextTrackRecord.mockReturnValue(Promise.resolve(true));

      const timedtexttrack = {
        is_ready_to_play: true,
        language: 'fr',
        upload_state: uploadState.READY,
      } as TimedText;

      const wrapper = shallow(
        <TimedTextListItem
          deleteTimedTextTrackRecord={mockDeleteTimedTextTrackRecord}
          jwt={'some token'}
          track={timedtexttrack}
        />,
      );

      (wrapper.instance() as TimedTextListItem).deleteTimedTextTrack();
      await flushAllPromises();

      expect(mockDeleteTimedTextTrack).toHaveBeenCalledWith(
        'some token',
        timedtexttrack,
      );
      expect(mockDeleteTimedTextTrackRecord).toHaveBeenCalledWith(
        timedtexttrack,
      );
    });
  });
});
