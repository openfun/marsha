import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useJwt } from 'lib-components';
import React from 'react';

import { useInfoWidgetModal } from 'data/stores/useInfoWidgetModal';
import render from 'utils/tests/render';

import { UploadTranscripts } from '.';
import fetchMock from 'fetch-mock';

jest.mock('data/stores/useInfoWidgetModal', () => ({
  useInfoWidgetModal: jest.fn(),
}));

const mockUseInfoWidgetModal = useInfoWidgetModal as jest.MockedFunction<
  typeof useInfoWidgetModal
>;

const languageChoices = [
  { display_name: 'English', value: 'en' },
  { display_name: 'French', value: 'fr' },
];

describe('<UploadTranscripts />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () => ({ locale: 'fr_FR' } as any),
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the UploadTranscripts', () => {
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

    render(<UploadTranscripts />);

    screen.getByText('Transcripts');

    const infoButton = screen.getByRole('button', { name: 'help' });
    act(() => userEvent.click(infoButton));

    expect(mockSetInfoWidgetModalProvider).toHaveBeenCalledTimes(1);
    expect(mockSetInfoWidgetModalProvider).toHaveBeenLastCalledWith({
      title: 'Transcripts',
      text: 'This widget allows you upload transcripts for the video.',
    });
  });
});
