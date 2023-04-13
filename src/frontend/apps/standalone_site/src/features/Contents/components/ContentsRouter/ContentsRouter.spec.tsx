import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { useContentFeatures } from '../../store/contentsStore';

import ContentsRouter from './ContentsRouter';

jest.mock('features/Contents', () => ({
  Contents: () => <div>My Contents</div>,
}));

const ClassroomRouter = () => <div>My ClassRoomRouter</div>;
const VideoRouter = () => <div>My VideoRouter</div>;
const LiveRouter = () => <div>My LiveRouter</div>;
useContentFeatures.setState(
  {
    featureRoutes: [
      <ClassroomRouter key="classroomRouter" />,
      <VideoRouter key="videoRouter" />,
      <LiveRouter key="liveRouter" />,
    ],
  },
  true,
);

describe('<ContentsRouter/>', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render route /my-contents', () => {
    render(<ContentsRouter />, {
      routerOptions: { history: ['/my-contents'] },
    });

    expect(screen.getByText('My Contents')).toBeInTheDocument();
    expect(screen.queryByText('My ClassRoomRouter')).not.toBeInTheDocument();
    expect(screen.queryByText('My VideoRouter')).not.toBeInTheDocument();
    expect(screen.queryByText('My LiveRouter')).not.toBeInTheDocument();
  });

  test('render from useContentFeatures', () => {
    render(<ContentsRouter />, {
      routerOptions: { history: ['/my-contents/classroom'] },
    });

    expect(screen.queryByText('My Contents')).not.toBeInTheDocument();
    expect(screen.getByText('My ClassRoomRouter')).toBeInTheDocument();
    expect(screen.getByText('My VideoRouter')).toBeInTheDocument();
    expect(screen.getByText('My LiveRouter')).toBeInTheDocument();
  });
});
