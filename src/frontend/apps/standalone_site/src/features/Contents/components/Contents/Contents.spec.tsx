import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { useContentFeatures } from '../../store/contentsStore';

import Contents from './Contents';

interface ContentsProps {
  playlistId?: string;
}

const ClassRoomContents = ({ playlistId }: ContentsProps) => (
  <div>Classrooms Component {playlistId}</div>
);
const LiveContents = ({ playlistId }: ContentsProps) => (
  <div>Videos Component {playlistId}</div>
);
const VideoContents = ({ playlistId }: ContentsProps) => (
  <div>Webinars Component {playlistId}</div>
);
useContentFeatures.setState(
  {
    featureSamples: (playlistId) => [
      <ClassRoomContents key="classRoomContents" playlistId={playlistId} />,
      <LiveContents key="liveContents" playlistId={playlistId} />,
      <VideoContents key="videoContents" playlistId={playlistId} />,
    ],
  },
  true,
);

describe('<Contents />', () => {
  test('renders Contents', () => {
    render(<Contents />);

    expect(screen.getByText(/Classrooms Component/i)).toBeInTheDocument();
    expect(screen.getByText(/Webinars Component/i)).toBeInTheDocument();
    expect(screen.getByText(/Videos Component/i)).toBeInTheDocument();
  });

  test('renders Contents with playlistId prop', () => {
    render(<Contents playlistId="test-playlist-id" />);

    expect(
      screen.getByText(/Classrooms Component test-playlist-id/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Videos Component test-playlist-id/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Webinars Component test-playlist-id/i),
    ).toBeInTheDocument();
  });
});
