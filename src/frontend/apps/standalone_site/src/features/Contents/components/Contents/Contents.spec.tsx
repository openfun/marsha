import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { useContentFeatures } from '../../store/contentsStore';

import Contents from './Contents';

interface ContentsProps {
  playlistId?: string;
}

const ClassRooms = ({ playlistId }: ContentsProps) => (
  <div>Classrooms Component {playlistId}</div>
);
const Webinars = ({ playlistId }: ContentsProps) => (
  <div>Webinars Component {playlistId}</div>
);
const Videos = ({ playlistId }: ContentsProps) => (
  <div>Videos Component {playlistId}</div>
);
useContentFeatures.setState(
  {
    featureSamples: (playlistId) => [
      {
        title: {
          defaultMessage: 'My Classrooms',
          description: '',
          id: 'classroom-id',
        },
        route: '/my-classroom',
        component: <ClassRooms playlistId={playlistId} />,
      },
      {
        title: {
          defaultMessage: 'My Webinars',
          description: '',
          id: 'webinar-id',
        },
        route: '/my-lives',
        component: <Webinars playlistId={playlistId} />,
      },
      {
        title: {
          defaultMessage: 'My Videos',
          description: '',
          id: 'video-id',
        },
        route: '/my-videos',
        component: <Videos playlistId={playlistId} />,
      },
    ],
  },
  true,
);

describe('<Contents />', () => {
  test('renders Contents', () => {
    render(<Contents />);
    expect(screen.getByText(/My Classrooms/)).toBeInTheDocument();
    expect(screen.getByText(/My Videos/)).toBeInTheDocument();
    expect(screen.getByText(/My Webinars/)).toBeInTheDocument();
    expect(screen.getByText(/Classrooms Component/i)).toBeInTheDocument();
    expect(screen.getByText(/Webinars Component/i)).toBeInTheDocument();
    expect(screen.getByText(/Videos Component/i)).toBeInTheDocument();
    expect(screen.getAllByText(/See Everything/i)).toHaveLength(3);
    expect(screen.getAllByText(/See Everything/i)[0]).toHaveAttribute(
      'href',
      '/my-classroom',
    );
    expect(screen.getAllByText(/See Everything/i)[1]).toHaveAttribute(
      'href',
      '/my-lives',
    );
    expect(screen.getAllByText(/See Everything/i)[2]).toHaveAttribute(
      'href',
      '/my-videos',
    );
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
    expect(screen.getAllByText(/See Everything/i)[0]).toHaveAttribute(
      'href',
      '/my-classroom?playlist=test-playlist-id',
    );
    expect(screen.getAllByText(/See Everything/i)[1]).toHaveAttribute(
      'href',
      '/my-lives?playlist=test-playlist-id',
    );
    expect(screen.getAllByText(/See Everything/i)[2]).toHaveAttribute(
      'href',
      '/my-videos?playlist=test-playlist-id',
    );
  });
});
