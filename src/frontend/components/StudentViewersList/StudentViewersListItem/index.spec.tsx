import React from 'react';
import { screen } from '@testing-library/react';

import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { StudentViewersListItem } from '.';

describe('<StudentViewersListItem />', () => {
  it('renders StudentViewersListItem component, for a student, and compares it with previous render.', async () => {
    await renderImageSnapshot(
      <StudentViewersListItem isInstructor={false} name={'An example name'} />,
    );
    screen.getByText('An example name');
  });

  it('renders StudentViewersListItem component, for an instructor, and compares it with previous render.', async () => {
    await renderImageSnapshot(
      <StudentViewersListItem isInstructor={true} name={'An example name'} />,
    );
    screen.getByText('An example name');
  });
});
