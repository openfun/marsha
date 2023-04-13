import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { useContentFeatures } from '../../store/contentsStore';

import ContentsShuffle from './ContentsShuffle';

const ClassRoomContents = () => <div>Part of my classrooms</div>;
useContentFeatures.setState(
  {
    featureShuffles: [<ClassRoomContents key="classRoomContents" />],
  },
  true,
);

describe('<ContentsShuffle />', () => {
  test('renders ContentsShuffle', () => {
    render(<ContentsShuffle />);
    expect(screen.getByText(/Part of my classrooms/i)).toBeInTheDocument();
  });
});
