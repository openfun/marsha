import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'grommet';

import { wrapInIntlProvider } from 'utils/tests/intl';

import { PictureActionLayer } from '.';

window.scrollTo = jest.fn();

describe('<PictureActionLayer />', () => {
  it('renders all actions', () => {
    render(
      wrapInIntlProvider(
        <PictureActionLayer
          actions={[<Button label="do some stuff" />]}
          pictureWidth={500}
        />,
      ),
    );

    screen.getByRole('button', { name: 'do some stuff' });
  });

  it('renders only more options action', () => {
    render(
      wrapInIntlProvider(
        <PictureActionLayer
          actions={[<Button label="do some stuff" />]}
          pictureWidth={5}
        />,
      ),
    );

    userEvent.click(screen.getByRole('button', { name: 'More options' }));
  });
});
