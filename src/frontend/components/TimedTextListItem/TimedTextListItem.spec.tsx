import { flushAllPromises } from '../../testSetup';

import { shallow } from 'enzyme';
import fetchMock from 'fetch-mock';
import * as React from 'react';

jest.mock(
  '../../data/sideEffects/deleteTimedTextTrack/deleteTimedTextTrack',
  () => ({ deleteTimedTextTrack: jest.fn() }),
);

jest.mock('react-router-dom', () => ({
  Link: () => null,
}));

import { deleteTimedTextTrack } from '../../data/sideEffects/deleteTimedTextTrack/deleteTimedTextTrack';
import { TimedText, uploadState } from '../../types/tracks';
import { TimedTextListItem } from './TimedTextListItem';

const mockDeleteTimedTextTrack: jest.Mock<
  typeof deleteTimedTextTrack
> = deleteTimedTextTrack as any;
const mockUpdateTimedTextTrackRecord = jest.fn();

describe('<TimedTextListItem />', () => {
  jest.useFakeTimers();

  afterEach(fetchMock.restore);

  const mockDeleteTimedTextTrackRecord = jest.fn();
  const mockGetTimedTextTrackLanguageChoices = jest.fn();

  const languageChoices = [
    {
      label: 'French',
      value: 'fr',
    },
  ];

  it('renders a track, showing its language and status', async () => {
    const wrapper = shallow(
      <TimedTextListItem
        getTimedTextTrackLanguageChoices={mockGetTimedTextTrackLanguageChoices}
        deleteTimedTextTrackRecord={mockDeleteTimedTextTrackRecord}
        updateTimedTextTrackRecord={jest.fn()}
        languageChoices={languageChoices}
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

    expect(wrapper.html()).toContain('French');
    expect(wrapper.html()).toContain('Ready');
  });

  it('renders & fail to poll a ready timed text track', async () => {
    shallow(
      <TimedTextListItem
        getTimedTextTrackLanguageChoices={mockGetTimedTextTrackLanguageChoices}
        deleteTimedTextTrackRecord={mockDeleteTimedTextTrackRecord}
        updateTimedTextTrackRecord={mockUpdateTimedTextTrackRecord}
        languageChoices={languageChoices}
        jwt={'some token'}
        track={
          {
            id: '1',
            is_ready_to_play: false,
            language: 'fr',
            upload_state: uploadState.PROCESSING,
          } as TimedText
        }
      />,
    );

    fetchMock.mock(
      '/api/timedtexttracks/1/',
      JSON.stringify({
        id: '1',
        is_ready_to_play: false,
        language: 'fr',
        upload_state: uploadState.PROCESSING,
      } as TimedText),
    );

    expect(fetchMock.called()).not.toBeTruthy();

    // first backend call
    jest.advanceTimersByTime(1000 * 10 + 200);
    await flushAllPromises();

    expect(fetchMock.lastCall()![0]).toEqual('/api/timedtexttracks/1/');
    expect(mockUpdateTimedTextTrackRecord).not.toHaveBeenCalled();

    let timer: number = 15;

    for (let i = 2; i <= 20; i++) {
      timer = timer * i;
      jest.advanceTimersByTime(1000 * timer + 200);
      await flushAllPromises();

      expect(fetchMock.calls('/api/timedtexttracks/1/').length).toEqual(i);
      expect(fetchMock.lastCall()![0]).toEqual('/api/timedtexttracks/1/');
      expect(mockUpdateTimedTextTrackRecord).not.toHaveBeenCalled();
    }

    // API should be fetch 20 times and no more.
    timer = timer * 21;
    jest.advanceTimersByTime(1000 * timer + 200);
    await flushAllPromises();

    expect(fetchMock.calls('/api/timedtexttracks/1/').length).toEqual(20);
  });

  it('renders & fail to poll a ready timed text track', async () => {
    shallow(
      <TimedTextListItem
        getTimedTextTrackLanguageChoices={mockGetTimedTextTrackLanguageChoices}
        deleteTimedTextTrackRecord={mockDeleteTimedTextTrackRecord}
        updateTimedTextTrackRecord={mockUpdateTimedTextTrackRecord}
        languageChoices={languageChoices}
        jwt={'some token'}
        track={
          {
            id: '1',
            is_ready_to_play: false,
            language: 'fr',
            upload_state: uploadState.PROCESSING,
          } as TimedText
        }
      />,
    );

    fetchMock.mock(
      '/api/timedtexttracks/1/',
      JSON.stringify({
        id: '1',
        is_ready_to_play: false,
        language: 'fr',
        upload_state: uploadState.PROCESSING,
      } as TimedText),
    );

    expect(fetchMock.called()).not.toBeTruthy();

    // first backend call
    jest.advanceTimersByTime(1000 * 10 + 200);
    await flushAllPromises();

    fetchMock.restore();
    fetchMock.mock(
      '/api/timedtexttracks/1/',
      JSON.stringify({
        id: '1',
        is_ready_to_play: true,
        language: 'fr',
        upload_state: uploadState.READY,
      } as TimedText),
    );

    // Second backend call
    jest.advanceTimersByTime(1000 * 30 + 200);
    await flushAllPromises();

    expect(fetchMock.lastCall()![0]).toEqual('/api/timedtexttracks/1/');
    expect(mockUpdateTimedTextTrackRecord).toHaveBeenCalledWith({
      id: '1',
      is_ready_to_play: true,
      language: 'fr',
      upload_state: uploadState.READY,
    });
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
          getTimedTextTrackLanguageChoices={
            mockGetTimedTextTrackLanguageChoices
          }
          deleteTimedTextTrackRecord={mockDeleteTimedTextTrackRecord}
          updateTimedTextTrackRecord={jest.fn()}
          languageChoices={languageChoices}
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
