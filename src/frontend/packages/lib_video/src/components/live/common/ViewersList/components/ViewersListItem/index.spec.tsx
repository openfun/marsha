import { screen } from '@testing-library/react';
import { renderImageSnapshot } from 'lib-tests';
import React from 'react';

import { ViewersListItem } from '.';

describe('<ViewersListItem />', () => {
  it('renders ViewersListItem component, for a student, and compares it with previous render. [screenshot]', async () => {
    await renderImageSnapshot(
      <ViewersListItem isInstructor={false} name="An example name" />,
    );

    expect(screen.getByText('An example name')).toBeInTheDocument();
  });

  it('renders ViewersListItem component, for an instructor, and compares it with previous render. [screenshot]', async () => {
    await renderImageSnapshot(
      <ViewersListItem isInstructor={true} name="An example name" />,
    );

    expect(screen.getByText('An example name')).toBeInTheDocument();
  });
});
