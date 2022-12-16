import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';
import React from 'react';

import { LiveModale } from '.';

describe('LiveModale', () => {
  it('renders content', () => {
    const firstAction = jest.fn();
    const secondAction = jest.fn();

    render(
      <LiveModale
        content={<p>my content</p>}
        actions={[
          { label: 'first button', action: firstAction },
          { label: 'second button', action: secondAction },
        ]}
      />,
    );

    screen.getByText('my content');
    screen.getByRole('button', { name: 'first button' });
    userEvent.click(screen.getByRole('button', { name: 'second button' }));

    expect(firstAction).not.toHaveBeenCalled();
    expect(secondAction).toHaveBeenCalledTimes(1);
  });
});
