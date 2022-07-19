import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { useInfoWidgetModal } from 'data/stores/useInfoWidgetModal';
import { useJwt } from 'data/stores/useJwt';
import { useTimedTextTrackLanguageChoices } from 'data/stores/useTimedTextTrackLanguageChoices';
import render from 'utils/tests/render';
import { InstructorDashboardVODWidgetUploadSubtitles } from '.';

jest.mock('data/stores/useInfoWidgetModal', () => ({
  useInfoWidgetModal: jest.fn(),
}));

const mockUseInfoWidgetModal = useInfoWidgetModal as jest.MockedFunction<
  typeof useInfoWidgetModal
>;

const languageChoices = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
];

describe('<DashboardVODWidgetUploadSubtitles />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () => ({ locale: 'fr_FR' } as any),
    });
  });

  it('renders the DashboardVODWidgetUploadSubtitles', () => {
    const mockSetInfoWidgetModalProvider = jest.fn();
    mockUseInfoWidgetModal.mockReturnValue([
      null,
      mockSetInfoWidgetModalProvider,
    ]);

    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
    });

    render(<InstructorDashboardVODWidgetUploadSubtitles />);

    screen.getByText('Subtitles');

    const infoButton = screen.getByRole('button', { name: 'help' });
    act(() => userEvent.click(infoButton));

    expect(mockSetInfoWidgetModalProvider).toHaveBeenCalledTimes(1);
    expect(mockSetInfoWidgetModalProvider).toHaveBeenLastCalledWith({
      title: 'Subtitles',
      text: 'This widget allows you upload subtitles for the video.',
    });
  });
});
