import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { Select } from './index';

window.scrollTo = jest.fn();

describe('<Select />', () => {
  it('checks drop position under select', async () => {
    render(
      <Select
        aria-label="my-select"
        options={['option 1', 'option 2', 'option 3', 'option 4']}
        dropProps={{
          'aria-label': 'my-drop',
        }}
      />,
    );

    screen
      .getByRole('button', {
        name: 'my-select',
      })
      .click();

    expect(await screen.findByLabelText('my-drop')).toHaveStyle(
      'transform-origin: bottom left;',
    );
  });

  it('checks drop position above select', async () => {
    render(
      <Select
        aria-label="my-select"
        options={['option 1', 'option 2', 'option 3', 'option 4']}
        dropProps={{
          'aria-label': 'my-drop',
        }}
        maxDropHeight={-100}
      />,
    );

    screen
      .getByRole('button', {
        name: 'my-select',
      })
      .click();

    expect(await screen.findByLabelText('my-drop')).toHaveStyle(
      'transform-origin: top left;',
    );
  });

  it('checks if children are correctly displayed', async () => {
    render(
      <Select
        aria-label="my-select"
        options={['option 1', 'option 2', 'option 3', 'option 4']}
      >
        {(option: string) => <div>My {option}</div>}
      </Select>,
    );

    screen
      .getByRole('button', {
        name: 'my-select',
      })
      .click();

    expect(await screen.findByText('My option 1')).toBeInTheDocument();
    expect(screen.getByText('My option 2')).toBeInTheDocument();
    expect(screen.getByText('My option 3')).toBeInTheDocument();
    expect(screen.getByText('My option 4')).toBeInTheDocument();
  });
});
