import { screen } from '@testing-library/react';
import { renderImageSnapshot } from 'lib-tests';
import React from 'react';

import { ViewersListHeader } from '.';

describe('<ViewersListHeader />', () => {
  it('renders ViewersListHeader component and compares it with previous render. [screenshot]', async () => {
    await renderImageSnapshot(
      <ViewersListHeader margin={{ bottom: '6px' }} text="An example text" />,
    );

    expect(await screen.findByText('An example text')).toBeInTheDocument();
  });
});
