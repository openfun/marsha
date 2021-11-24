import { render, screen } from '@testing-library/react';
import React from 'react';

import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { LiveControlButtons } from '.';
import {
  LivePanelDetail,
  useLivePanelState,
} from 'data/stores/useLivePanelState';

describe('<LiveControlButtons />', () => {
  it('render all buttons when student is a viewer and chat is enabled', () => {
    useParticipantWorkflow.setState({
      accepted: false,
    });
    useLivePanelState.setState({
      availableDetails: [LivePanelDetail.CHAT],
    });

    render(wrapInRouter(wrapInIntlProvider(<LiveControlButtons />)));

    screen.getByRole('button', { name: 'Upload file' });
    screen.getByRole('button', { name: 'Show viewers' });
    screen.getByRole('button', { name: 'Show/Hide Chat' });
    screen.getByRole('button', { name: 'Send request to join the discussion' });
  });

  it('render all buttons but chat when student is a viewer and chat is disabled', () => {
    useParticipantWorkflow.setState({
      accepted: false,
    });

    render(wrapInRouter(wrapInIntlProvider(<LiveControlButtons />)));

    screen.getByRole('button', { name: 'Upload file' });
    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Show/Hide Chat' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Send request to join the discussion' });
  });

  it('render all buttons when student is in the discussion and chat is enabled', () => {
    useParticipantWorkflow.setState({
      accepted: true,
    });
    useLivePanelState.setState({
      availableDetails: [LivePanelDetail.CHAT],
    });

    render(wrapInRouter(wrapInIntlProvider(<LiveControlButtons />)));

    screen.getByRole('button', { name: 'Upload file' });
    screen.getByRole('button', { name: 'Show viewers' });
    screen.getByRole('button', { name: 'Show/Hide Chat' });
    screen.getByRole('button', { name: 'Leave discussion' });
  });

  it('render all buttons but chat when student is in the discussion and chat is disabled', () => {
    useParticipantWorkflow.setState({
      accepted: true,
    });

    render(wrapInRouter(wrapInIntlProvider(<LiveControlButtons />)));

    screen.getByRole('button', { name: 'Upload file' });
    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Show/Hide Chat' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Leave discussion' });
  });
});
