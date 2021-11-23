import { render, screen } from '@testing-library/react';
import React from 'react';

import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { LiveControlButtons } from '.';

describe('<LiveControlButtons />', () => {
  it('render all buttons when studient is a viewer', () => {
    useParticipantWorkflow.setState({
      accepted: false,
    });

    render(wrapInRouter(wrapInIntlProvider(<LiveControlButtons />)));

    screen.getByRole('button', { name: 'Document' });
    screen.getByRole('button', { name: 'Viewers' });
    screen.getByRole('button', { name: 'Chat' });
    screen.getByRole('button', { name: 'Send request to join the discussion' });
  });

  it('render all buttons when studient is in the discussion', () => {
    useParticipantWorkflow.setState({
      accepted: true,
    });

    render(wrapInRouter(wrapInIntlProvider(<LiveControlButtons />)));

    screen.getByRole('button', { name: 'Document' });
    screen.getByRole('button', { name: 'Viewers' });
    screen.getByRole('button', { name: 'Chat' });
    screen.getByRole('button', { name: 'Leave discussion' });
  });
});
