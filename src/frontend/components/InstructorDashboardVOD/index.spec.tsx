import { screen, within } from '@testing-library/react';
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

    // DashboardVideoLiveWidgetThumbnail
    screen.getByText('Thumbnail');
    expect(
      screen.queryByRole('button', {
        name: 'Delete thumbnail',
      }),
    ).toEqual(null);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual(
      'https://liveBackground.com/liveBackgroung.png',
    );
    screen.getByRole('button', { name: 'Upload an image' });

    // InstructorDashboardVODWidgetDownloadVideo
    screen.getByText('Download video');
    const button = screen.getByRole('button', {
      name: 'This input allows you to select the quality you desire for your download.; Selected: 1080',
    });
    within(button).getByText('1080 p');
    screen.getByRole('button', { name: 'Download' });

    // InstructorDashboardVODWidgetUpload Subtitles / Closed captions / Transcripts
    screen.getByText('Subtitles');
    screen.getByText('Closed captions');
    screen.getByText('Transcripts');

    expect(
      screen.getAllByRole('button', {
        name: 'Select the language for which you want to upload a timed text file; Selected: fr',
      }),
    ).toHaveLength(3);
    const textboxes = screen.getAllByRole('textbox', {
      name: 'Select the language for which you want to upload a timed text file, fr',
    });
    textboxes.forEach((textbox) => expect(textbox).toHaveValue('French'));
    expect(screen.getAllByText('No uploaded files')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Upload file' })).toHaveLength(
      3,
    );
  });
});
