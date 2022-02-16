import { render, screen } from '@testing-library/react';
import React from 'react';

import { TeacherLiveInfoBar } from '.';

describe('<TeacherLiveInfoBar />', () => {
  it('renders title and startDate', () => {
    render(<TeacherLiveInfoBar title={'title'} startDate={'some date'} />);

    screen.getByRole('heading', { name: 'title' });
    screen.getByText('some date');
  });
});
