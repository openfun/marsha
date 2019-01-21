import { flushAllPromises } from '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

jest.mock(
  '../../data/sideEffects/deleteTimedTextTrack/deleteTimedTextTrack',
  () => ({ deleteTimedTextTrack: jest.fn() }),
);

jest.mock(
  '../../data/sideEffects/getTimedTextTrackLanguageChoices/getTimedTextTrackLanguageChoices',
  () => ({
    getTimedTextTrackLanguageChoices: jest.fn(),
  }),
);

jest.mock('react-router-dom', () => ({
  Link: () => null,
}));

import { deleteTimedTextTrack } from '../../data/sideEffects/deleteTimedTextTrack/deleteTimedTextTrack';
import { getTimedTextTrackLanguageChoices } from '../../data/sideEffects/getTimedTextTrackLanguageChoices/getTimedTextTrackLanguageChoices';
import { TimedText, uploadState } from '../../types/tracks';
import { TimedTextListItem } from './TimedTextListItem';

const mockDeleteTimedTextTrack: jest.Mock<
  typeof deleteTimedTextTrack
> = deleteTimedTextTrack as any;
const mockGetTimedTextTrackLanguageChoices: jest.Mock<
  typeof getTimedTextTrackLanguageChoices
> = getTimedTextTrackLanguageChoices as any;

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
