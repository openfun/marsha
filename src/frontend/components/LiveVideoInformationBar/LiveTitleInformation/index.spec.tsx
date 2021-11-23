import { render, screen } from '@testing-library/react';
import React from 'react';
import { liveState } from 'types/tracks';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { LiveTitleInformation } from '.';

describe('<LiveTitleInformation />', () => {
  it('render all buttons when studient is a viewer', () => {
    const title = 'title';
    const state: liveState | null = null;

    const { container } = render(
      wrapInRouter(
        wrapInIntlProvider(
          <LiveTitleInformation title={title} state={state} />,
        ),
      ),
    );

    screen.getByText(title);
    expect(container.querySelector('#red-dot-id')).not.toBeInTheDocument();
  });

  it('render all buttons when studient is in the discussion', () => {
    const title = 'title';
    const state: liveState = liveState.RUNNING;

    const { container } = render(
      wrapInRouter(
        wrapInIntlProvider(
          <LiveTitleInformation title={title} state={state} />,
        ),
      ),
    );

    screen.getByText(title);
    expect(container.querySelector('#red-dot-id')).toBeInTheDocument();
  });
});
