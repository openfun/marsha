import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { UploadVideoProgress } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  ProgressionBar: (props: { progressPercentage: number }) => (
    <p>{`ProgressionBar ${props.progressPercentage} %`}</p>
  ),
}));

describe('<UploadVideoProgress />', () => {
  it('renders UploadVideoProgress', () => {
    render(<UploadVideoProgress progress={45} />);

    expect(screen.getByText('ProgressionBar 45 %')).toBeInTheDocument();
  });
});
