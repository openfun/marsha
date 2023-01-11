import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'grommet';
import { render } from 'lib-tests';
import React from 'react';

import { PictureActionLayer } from '.';

describe('<PictureActionLayer />', () => {
  it('renders all actions', () => {
    render(
      <PictureActionLayer
        actions={[<Button key="button" label="do some stuff" />]}
        pictureWidth={500}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'do some stuff' }),
    ).toBeInTheDocument();
  });

  it('renders only more options action', () => {
    render(
      <PictureActionLayer
        actions={[<Button key="button" label="do some stuff" />]}
        pictureWidth={5}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'More options' }),
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'More options' }));
  });
});
