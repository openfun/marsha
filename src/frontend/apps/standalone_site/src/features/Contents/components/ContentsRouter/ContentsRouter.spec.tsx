import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { useContentFeatures } from '../../store/contentsStore';

import ContentsRouter from './ContentsRouter';

jest.mock('../Contents/Contents', () => ({
  default: () => <div>My Contents</div>,
  __esModule: true,
}));

const ClassroomRouter = () => <div>My ClassRoomRouter</div>;
const VideoRouter = () => <div>My VideoRouter</div>;
const LiveRouter = () => <div>My LiveRouter</div>;
useContentFeatures.setState(
  {
    featureRouter: [
      <ClassroomRouter key="classroomRouter" />,
      <VideoRouter key="videoRouter" />,
      <LiveRouter key="liveRouter" />,
    ],
    featureRoutes: {
      CLASSROOM: {
        path: '/my-contents/classroom',
        pathKey: 'classroom',
      },
      VIDEO: {
        path: '/my-contents/videos',
        pathKey: 'videos',
      },
      LIVE: {
        path: '/my-contents/webinars',
        pathKey: 'webinars',
      },
    },
  },
  true,
);

describe('<ContentsRouter/>', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render route /my-contents', () => {
    render(<ContentsRouter />, {
      routerOptions: {
        componentPath: '/my-contents/*',
        history: ['/my-contents'],
      },
    });

    expect(screen.getByText('My Contents')).toBeInTheDocument();
    expect(screen.queryByText('My ClassRoomRouter')).not.toBeInTheDocument();
    expect(screen.queryByText('My VideoRouter')).not.toBeInTheDocument();
    expect(screen.queryByText('My LiveRouter')).not.toBeInTheDocument();
  });

  test('render from useContentFeatures', async () => {
    render(<ContentsRouter />, {
      routerOptions: {
        componentPath: '/my-contents/*',
        history: ['/my-contents/classroom'],
      },
    });

    expect(screen.queryByText('My Contents')).not.toBeInTheDocument();
    expect(await screen.findByText('My ClassRoomRouter')).toBeInTheDocument();
  });

  test('render bad route', () => {
    render(<ContentsRouter />, {
      routerOptions: {
        componentPath: '/my-contents/*',
        history: ['/my-contents/bad-road'],
      },
    });

    expect(
      screen.getByText(/Sorry, this page does not exist./i),
    ).toBeInTheDocument();
  });
});
