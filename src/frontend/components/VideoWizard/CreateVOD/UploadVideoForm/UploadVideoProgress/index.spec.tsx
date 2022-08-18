import { screen } from '@testing-library/react';
import React from 'react';

import render from 'utils/tests/render';
import { UploadVideoProgress } from '.';

jest.mock('components/graphicals/ProgressionBar', () => ({
  ProgressionBar: (props: { progressPercentage: number }) => (
    <p>{`ProgressionBar ${props.progressPercentage} %`}</p>
  ),
}));

describe('<UploadVideoProgress />', () => {
  it('renders UploadVideoProgress', () => {
    render(<UploadVideoProgress progress={45} />);
    screen.getByText('ProgressionBar 45 %');
  });
});
