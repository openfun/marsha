import { screen } from '@testing-library/react';
import React from 'react';

import { useTimedTextTrackLanguageChoices } from 'data/stores/useTimedTextTrackLanguageChoices';
import render from 'utils/tests/render';
import { InstructorDashboardVOD } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'some token',
    video: {
      id: 'video_id',
      title: 'Title of the video',
      description: 'An example description',
      upload_state: 'ready',
      urls: {
        manifests: {
          hls: 'https://example.com/hls',
        },
        mp4: {
          144: 'https://example.com/mp4/144.mp4',
          240: 'https://example.com/mp4/240',
          480: 'https://example.com/mp4/480',
          720: 'https://example.com/mp4/720',
          1080: 'https://example.com/mp4/1080',
        },
        thumbnails: {
          144: 'https://example.com/default_thumbnail/144',
          240: 'https://example.com/default_thumbnail/240',
          480: 'https://example.com/default_thumbnail/480',
          720: 'https://example.com/default_thumbnail/720',
          1080: 'https://example.com/default_thumbnail/1080',
        },
      },
      thumbnail: {
        id: 'thumbnail_id',
      },
      timed_text_tracks: {
        ttt1_id: {
          id: 'tt1_id',
        },
      },
    },
    static: {
      img: {
        liveBackground: 'https://liveBackground.com/liveBackgroung.png',
      },
    },
  },
  getDecodedJwt: () => ({ locale: 'fr-FR' }),
}));

const languageChoices = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
];

describe('<InstructorDashboardVOD />', () => {
  it('renders the InstructorDashboardVOD', () => {
    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
    });

    const { container } = render(<InstructorDashboardVOD />);

    // Video
    const videoElement = container.getElementsByTagName('video')[0]!;
    expect(videoElement).toHaveAttribute(
      'poster',
      'https://example.com/default_thumbnail/1080',
    );
    expect(videoElement.getElementsByTagName('source')).toHaveLength(5);

    // TeacherLiveInfoBar
    screen.getByRole('heading', { name: 'Title of the video' });

    // InstructorDashboardVODWidgetGeneralTitle
    screen.getByText('General');
    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your VOD here',
    });
    expect(textInput).toHaveValue('Title of the video');
    screen.getByPlaceholderText('Enter title of your VOD here');
    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    expect(textArea).toHaveValue('An example description');
    screen.getByPlaceholderText('Description...');

    // InstructorDashboardVODWidgetUploadVideo
    screen.getByText('Video');
    screen.getByText('Video available');
    screen.getByRole('button', { name: 'Replace the video' });
  });
});
