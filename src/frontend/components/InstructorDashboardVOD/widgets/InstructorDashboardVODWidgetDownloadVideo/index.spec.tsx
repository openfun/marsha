import { within } from '@testing-library/dom';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { PropsWithChildren } from 'react';

import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';
import { InstructorDashboardVODWidgetDownloadVideo } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'json web token',
  },
}));

const mockSetInfoWidgetModal = jest.fn();
jest.mock('data/stores/useInfoWidgetModal', () => ({
  useInfoWidgetModal: () => [
    { isVisible: false, text: null, title: null },
    mockSetInfoWidgetModal,
  ],
  InfoWidgetModalProvider: ({ children }: PropsWithChildren<{}>) => children,
}));

describe('<InstructorDashboardVODWidgetDownloadVideo />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the component', () => {
    const mockedVideo = videoMockFactory();
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <InstructorDashboardVODWidgetDownloadVideo />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Download video');
    act(() => userEvent.click(screen.getByRole('button', { name: 'help' })));
    expect(mockSetInfoWidgetModal).toHaveBeenCalledWith({
      title: 'Download video',
      text: 'This widget allows you to download the video, with the available quality you desire.',
    });

    const button = screen.getByRole('button', {
      name: 'This input allows you to select the quality you desire for your download.; Selected: 1080 p',
    });
    within(button).getByText('1080 p');

    screen.getByRole('link', { name: 'Download' });
  });

  it('selects the lowest quality', () => {
    const mockedVideo = videoMockFactory();

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <InstructorDashboardVODWidgetDownloadVideo />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const defaultButtonSelect = screen.getByRole('button', {
      name: 'This input allows you to select the quality you desire for your download.; Selected: 1080 p',
    });

    act(() => userEvent.click(defaultButtonSelect));

    const lowestQualityButtonSelect = screen.getByRole('option', {
      name: '144 p',
    });
    act(() => userEvent.click(lowestQualityButtonSelect));

    expect(screen.queryByText('240 p')).toBe(null);
    expect(screen.queryByText('720 p')).toBe(null);
    expect(screen.queryByText('1080 p')).toBe(null);

    screen.getByText('144 p');
  });

  it('downloads the video with the default selected quality', () => {
    const mockedVideo = videoMockFactory();

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <InstructorDashboardVODWidgetDownloadVideo />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('1080 p');
    const downloadButton = screen.getByRole('link', { name: 'Download' });
    expect(downloadButton).toHaveAttribute(
      'href',
      'https://example.com/mp4/1080',
    );
    userEvent.click(downloadButton);
  });

  it("renders the component when there aren't any resolutions available", () => {
    const mockedVideo = videoMockFactory({ urls: null });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <InstructorDashboardVODWidgetDownloadVideo />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('No resolutions available');
    const downloadButton = screen.getByRole('button', { name: 'Download' });
    expect(downloadButton).toBeDisabled();
  });
});
