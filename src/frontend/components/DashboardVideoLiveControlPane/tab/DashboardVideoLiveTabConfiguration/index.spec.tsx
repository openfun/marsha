import { within } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import faker from 'faker';
import { ResponsiveContext } from 'grommet';
import { DateTime } from 'luxon';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { useThumbnail } from 'data/stores/useThumbnail';
import { JoinMode } from 'types/tracks';
import { useSharedLiveMedia } from 'data/stores/useSharedLiveMedia';
import {
  sharedLiveMediaMockFactory,
  thumbnailMockFactory,
  videoMockFactory,
} from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DashboardVideoLiveTabConfiguration } from '.';
jest.mock('data/appData', () => ({
  appData: {},
}));

const currentDate = DateTime.fromISO('2022-01-13T12:00');

describe('<DashboardVideoLiveTabConfiguration />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(currentDate.toJSDate());
  });
  afterAll(() => {
    jest.useRealTimers();
  });
  it('renders DashboardVideoLiveTabConfiguration', () => {
    const videoId = faker.datatype.uuid();
    const mockedThumbnail = thumbnailMockFactory({
      video: videoId,
      is_ready_to_show: true,
    });
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: 'Title of the file',
      video: videoId,
    });
    const mockVideo = videoMockFactory({
      id: videoId,
      title: 'An example title',
      allow_recording: false,
      is_public: true,
      join_mode: JoinMode.APPROVAL,
      starting_at: currentDate.toString(),
      estimated_duration: '00:30',
      description: 'An example description',
      thumbnail: mockedThumbnail,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    useThumbnail.getState().addResource(mockedThumbnail);
    useSharedLiveMedia.getState().addResource(mockedSharedLiveMedia);

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <ResponsiveContext.Provider value="large">
            <DashboardVideoLiveTabConfiguration video={mockVideo} />
          </ResponsiveContext.Provider>
        </QueryClientProvider>,
      ),
    );

    // DashboardVideoLiveWidgetToolsAndApplications
    screen.getByText('Tools and applications');
    const hasChatToggleButton = screen.getByRole('checkbox', {
      name: 'Activate chat',
    });
    expect(hasChatToggleButton).toBeChecked();
    screen.getByText('Activate chat');

    // DashboardVideoLiveWidgetGeneralTitle
    screen.getByText('General');
    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your live here',
    });
    expect(textInput).toHaveValue('An example title');
    const liveRecordingToggleButton = screen.getByRole('checkbox', {
      name: 'Activate live recording',
    });
    expect(liveRecordingToggleButton).not.toBeChecked();
    screen.getByText('Activate live recording');

    // DashboardVideoLiveWidgetVisibilityAndInteraction
    screen.getByText('Visibility and interaction parameters');
    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).toBeChecked();
    screen.getByText('Make the video publicly available');
    screen.getByText('https://localhost/videos/'.concat(mockVideo.id));
    screen.getByRole('button', {
      name: "A button to copy the video's publicly available url in clipboard",
    });

    // DashboardVideoLiveTabConfigurationchedulingAndDescription
    screen.getByText('Description');
    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    expect(inputStartingAtDate).toHaveValue('2022/01/13');
    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    expect(inputStartingAtTime).toHaveValue('12:00');
    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    expect(inputEstimatedDuration).toHaveValue('0:30');
    screen.getByText("Webinar's end");
    screen.getByText('2022/01/13, 12:30');
    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    expect(textArea).toHaveValue('An example description');
    screen.getByPlaceholderText('Description...');

    // DashboardVideoLiveWidgetLivePairing
    const openButton = screen.getByRole('button', {
      name: 'External broadcast sources',
    });
    userEvent.click(openButton);
    screen.getByRole('button', {
      name: /pair an external device/i,
    });

    // DashboardVideoLiveTabConfigurationharedLiveMedia
    screen.getByText('Supports sharing');
    screen.getByRole('button', {
      name: 'Upload a presentation support',
    });
    screen.getByRole('button', {
      name: 'Click on this button to stop allowing students to download this media.',
    });
    screen.getByRole('button', { name: 'Share' });
    screen.getByRole('link', { name: 'Title of the file' });
    screen.getByRole('button', {
      name: 'Click on this button to delete the media.',
    });

    // DashboardVideoLiveWidgetVOD
    screen.getByText(/There is nothing to harvest/);

    // DashboardVideoLiveWidgetJoinMode
    screen.getByText('Join the discussion');
    const button = screen.getByRole('button', {
      name: /select join the discussion mode/i,
    });
    const select = within(button).getByRole('textbox');
    expect(select).toHaveValue('Accept joining the discussion after approval');

    // DashboardVideoLiveWidgetThumbnail
    screen.getByText('Thumbnail');
    const img = screen.getByRole('img', { name: 'Live video thumbnail' });
    expect(img.getAttribute('src')).toEqual(
      'https://example.com/default_thumbnail/144',
    );
    expect(img.getAttribute('srcset')).toEqual(
      'https://example.com/default_thumbnail/144 256w, https://example.com/default_thumbnail/240 426w, https://example.com/default_thumbnail/480 854w, https://example.com/default_thumbnail/720 1280w, https://example.com/default_thumbnail/1080 1920w',
    );
    screen.getByRole('button', { name: 'Delete thumbnail' });
    screen.getByRole('button', { name: 'Upload an image' });
  });
});
