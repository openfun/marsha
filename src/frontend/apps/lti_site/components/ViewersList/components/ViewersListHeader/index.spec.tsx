import React from 'react';
import { screen } from '@testing-library/react';

import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { ViewersListHeader } from '.';

describe('<ViewersListHeader />', () => {
  it('renders ViewersListHeader component and compares it with previous render. [screenshot]', async () => {
    await renderImageSnapshot(
      <ViewersListHeader margin={{ bottom: '6px' }} text="An example text" />,
    );
    screen.getByText('An example text');
  });
});
