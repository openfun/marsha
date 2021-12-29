import React from 'react';
import { screen } from '@testing-library/react';

import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { StudentViewersListHeader } from '.';

describe('<StudentViewersListHeader />', () => {
  it('renders StudentViewersListHeader component and compares it with previous render.', async () => {
    await renderImageSnapshot(
      <StudentViewersListHeader text="An example text" />,
    );
    screen.getByText('An example text');
  });
});
