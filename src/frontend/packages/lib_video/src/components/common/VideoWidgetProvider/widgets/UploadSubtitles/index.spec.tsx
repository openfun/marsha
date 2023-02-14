import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { useInfoWidgetModal } from 'hooks/useInfoWidgetModal';
import { wrapInVideo } from 'utils/wrapInVideo';

import { UploadSubtitles } from '.';

jest.mock('hooks/useInfoWidgetModal', () => ({
  useInfoWidgetModal: jest.fn(),
}));

const mockUseInfoWidgetModal = useInfoWidgetModal as jest.MockedFunction<
  typeof useInfoWidgetModal
>;

const languageChoices = [
  { display_name: 'English', value: 'en' },
  { display_name: 'French', value: 'fr' },
];

describe('<UploadSubtitles />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () => ({ locale: 'fr_FR' } as any),
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the UploadSubtitles', () => {
    fetchMock.mock(
      '/api/timedtexttracks/',
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );
    const mockSetInfoWidgetModalProvider = jest.fn();
    mockUseInfoWidgetModal.mockReturnValue([
      null,
      mockSetInfoWidgetModalProvider,
    ]);
    const mockedVideo = videoMockFactory();

    render(wrapInVideo(<UploadSubtitles />, mockedVideo));

    screen.getByText('Subtitles');

    const infoButton = screen.getByRole('button', { name: 'help' });

    userEvent.click(infoButton);

    expect(mockSetInfoWidgetModalProvider).toHaveBeenCalledTimes(1);
    expect(mockSetInfoWidgetModalProvider).toHaveBeenLastCalledWith({
      title: 'Subtitles',
      text: `This widget allows you upload subtitles for the video. Toggle to use as transcripts can be disabled because there is no subtitle or at least one transcript exists. Accepted formats : MicroDVD SUB (.sub) - SubRip (.srt) - SubViewer (.sbv) - WebVTT (.vtt) - SubStation Alpha (.ssa and .ass) - SAMI (.smi) aka Synchronized Accessible Media Interchange - LRC (.lrc) aka LyRiCs - JSON (.json)`,
      refWidget: expect.any(HTMLDivElement),
    });
  });
});
