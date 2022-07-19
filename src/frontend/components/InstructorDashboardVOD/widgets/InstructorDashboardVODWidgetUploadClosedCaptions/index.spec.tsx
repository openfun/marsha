import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { useInfoWidgetModal } from 'data/stores/useInfoWidgetModal';
import { useTimedTextTrackLanguageChoices } from 'data/stores/useTimedTextTrackLanguageChoices';
import render from 'utils/tests/render';
import { InstructorDashboardVODWidgetUploadClosedCaptions } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'some token',
  },
  getDecodedJwt: () => ({ locale: 'fr-FR' }),
}));

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

describe('<InstructorDashboardVODWidgetUploadClosedCaptions />', () => {
  it('renders the InstructorDashboardVODWidgetUploadClosedCaptions', () => {
    const mockSetInfoWidgetModalProvider = jest.fn();
    mockUseInfoWidgetModal.mockReturnValue([
      null,
      mockSetInfoWidgetModalProvider,
    ]);

    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
    });

    render(<InstructorDashboardVODWidgetUploadClosedCaptions />);

    screen.getByText('Closed captions');

    const infoButton = screen.getByRole('button', { name: 'help' });
    act(() => userEvent.click(infoButton));

    expect(mockSetInfoWidgetModalProvider).toHaveBeenCalledTimes(1);
    expect(mockSetInfoWidgetModalProvider).toHaveBeenLastCalledWith({
      title: 'Closed captions',
      text: 'This widget allows you upload closed captions for the video.',
    });
  });
});
