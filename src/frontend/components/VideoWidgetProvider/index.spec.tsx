import { within } from '@testing-library/dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import faker from 'faker';
import { DateTime } from 'luxon';
import React from 'react';

import { useJwt } from 'data/stores/useJwt';
import { useSharedLiveMedia } from 'data/stores/useSharedLiveMedia';
import { useTimedTextTrackLanguageChoices } from 'data/stores/useTimedTextTrackLanguageChoices';
import { useThumbnail } from 'data/stores/useThumbnail';
import { JoinMode } from 'types/tracks';
import {
  sharedLiveMediaMockFactory,
  thumbnailMockFactory,
  videoMockFactory,
} from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { VideoWidgetProvider } from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    static: { img: { liveBackground: 'some_url' } },
  }),
}));

const currentDate = DateTime.fromISO('2022-01-13T12:00');

describe('<VideoWidgetProvider />', () => {
  it('renders widgets for live', () => {
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

    render(wrapInVideo(<VideoWidgetProvider isLive />, mockVideo));

    // ToolsAndApplications
    screen.getByText('Tools and applications');
    const hasChatToggleButton = screen.getByRole('checkbox', {
      name: 'Activate chat',
    });
    expect(hasChatToggleButton).toBeChecked();
    screen.getByText('Activate chat');

    // GeneralTitle
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

    // VisibilityAndInteraction
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

    // DashboardLiveTabConfigurationchedulingAndDescription
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

    // LivePairing
    const openButton = screen.getByRole('button', {
      name: 'External broadcast sources',
    });
    userEvent.click(openButton);
    screen.getByRole('button', {
      name: /pair an external device/i,
    });

    // DashboardLiveTabConfigurationharedLiveMedia
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

    // VODCreation
    screen.getByText(/There is nothing to harvest/);

    // JoinMode
    screen.getByText('Join the discussion');
    const button = screen.getByRole('button', {
      name: /select join the discussion mode/i,
    });
    const select = within(button).getByRole('textbox');
    expect(select).toHaveValue('Accept joining the discussion after approval');

    // DashboardLiveWidgetThumbnail
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

  it('renders widget for vod', () => {
    const videoId = faker.datatype.uuid();
    const mockedThumbnail = thumbnailMockFactory({
      video: videoId,
      is_ready_to_show: true,
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
    });

    useThumbnail.getState().addResource(mockedThumbnail);

    useJwt.setState({
      getDecodedJwt: () => ({ locale: 'en' } as any),
    });

    useTimedTextTrackLanguageChoices.setState({
      choices: [{ label: 'some_language_label', value: 'some_language' }],
    });

    render(wrapInVideo(<VideoWidgetProvider isLive={false} />, mockVideo));

    //  Title and description
    screen.getByText('General');

    //  Upload video
    screen.getByText('Video');

    //  Download video
    screen.getByText('Download video');

    //  Subtitle
    screen.getByText('Subtitles');

    //  Transcripts
    screen.getByText('Transcripts');

    //  Closed captions
    screen.getByText('Closed captions');
  });
});
