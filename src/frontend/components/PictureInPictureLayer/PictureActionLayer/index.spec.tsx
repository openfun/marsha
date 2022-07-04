import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'grommet';

import render from 'utils/tests/render';

import { PictureActionLayer } from '.';

describe('<PictureActionLayer />', () => {
  it('renders all actions', () => {
    render(
      <PictureActionLayer
        actions={[<Button label="do some stuff" />]}
        pictureWidth={500}
      />,
    );

    screen.getByRole('button', { name: 'do some stuff' });
  });

  it('renders only more options action', () => {
    render(
      <PictureActionLayer
        actions={[<Button label="do some stuff" />]}
        pictureWidth={5}
      />,
    );

    userEvent.click(screen.getByRole('button', { name: 'More options' }));
  });
});
