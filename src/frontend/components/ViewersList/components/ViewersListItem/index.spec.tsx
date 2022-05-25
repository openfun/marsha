import { screen } from '@testing-library/react';
import React from 'react';

import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { ViewersListItem } from '.';

describe('<ViewersListItem />', () => {
  it('renders ViewersListItem component, for a student, and compares it with previous render. [screenshot]', async () => {
    await renderImageSnapshot(
      <ViewersListItem isInstructor={false} name={'An example name'} />,
    );
    screen.getByText('An example name');
  });

  it('renders ViewersListItem component, for an instructor, and compares it with previous render. [screenshot]', async () => {
    await renderImageSnapshot(
      <ViewersListItem isInstructor={true} name={'An example name'} />,
    );
    screen.getByText('An example name');
  });
});
