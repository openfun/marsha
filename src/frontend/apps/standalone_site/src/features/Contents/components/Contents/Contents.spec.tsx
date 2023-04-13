import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { useContentFeatures } from '../../store/contentsStore';

import Contents from './Contents';

const ClassRoomContents = () => <div>Classrooms Component</div>;
const LiveContents = () => <div>Videos Component</div>;
const VideoContents = () => <div>Webinars Component</div>;
useContentFeatures.setState(
  {
    featureSamples: [
      <ClassRoomContents key="classRoomContents" />,
      <LiveContents key="liveContents" />,
      <VideoContents key="videoContents" />,
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
});
