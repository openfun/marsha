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
import { videoMockFactory } from 'utils/tests/factories';
import { LiveModeType, liveState } from 'types/tracks';

describe('<LiveControlButtons />', () => {
  it('render all buttons when student is a viewer and chat is enabled', () => {
    //  student is a simple viewer (he was not accepted on stage)
    useParticipantWorkflow.setState({
      accepted: false,
    });
    //  init the store to support chat
    useLivePanelState.setState({
      availableDetails: [LivePanelDetail.CHAT],
    });
    //  mock the video to enable join the scene button
    const video = videoMockFactory({
      xmpp: {
        bosh_url: null,
        conference_url: 'conference',
        jid: 'jid',
        prebind_url: 'prebind',
        websocket_url: null,
      },
      live_type: LiveModeType.JITSI,
      live_state: liveState.RUNNING,
    });

    render(
      wrapInRouter(wrapInIntlProvider(<LiveControlButtons video={video} />)),
    );

    screen.getByRole('button', { name: 'Upload file' });
    screen.getByRole('button', { name: 'Show viewers' });
    screen.getByRole('button', { name: 'Show/Hide Chat' });
    screen.getByRole('button', { name: 'Send request to join the discussion' });
  });

  it('render all buttons but chat when student is a viewer and chat is disabled', () => {
    //  student is a simple viewer (he was not accepted on stage)
    useParticipantWorkflow.setState({
      accepted: false,
    });
    //  mock the video to enable join the scene button
    const video = videoMockFactory({
      xmpp: {
        bosh_url: null,
        conference_url: 'conference',
        jid: 'jid',
        prebind_url: 'prebind',
        websocket_url: null,
      },
      live_type: LiveModeType.JITSI,
      live_state: liveState.RUNNING,
    });

    render(
      wrapInRouter(wrapInIntlProvider(<LiveControlButtons video={video} />)),
    );

    screen.getByRole('button', { name: 'Upload file' });
    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Show/Hide Chat' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Send request to join the discussion' });
  });

  it('render all buttons when student is in the discussion and chat is enabled', () => {
    //  student is on stage
    useParticipantWorkflow.setState({
      accepted: true,
    });
    //  init the store to support chat
    useLivePanelState.setState({
      availableDetails: [LivePanelDetail.CHAT],
    });
    //  mock the video to enable join the scene button
    const video = videoMockFactory({
      xmpp: {
        bosh_url: null,
        conference_url: 'conference',
        jid: 'jid',
        prebind_url: 'prebind',
        websocket_url: null,
      },
      live_type: LiveModeType.JITSI,
      live_state: liveState.RUNNING,
    });

    render(
      wrapInRouter(wrapInIntlProvider(<LiveControlButtons video={video} />)),
    );

    screen.getByRole('button', { name: 'Upload file' });
    screen.getByRole('button', { name: 'Show viewers' });
    screen.getByRole('button', { name: 'Show/Hide Chat' });
    screen.getByRole('button', { name: 'Leave discussion' });
  });

  it('render all buttons but chat when student is in the discussion and chat is disabled', () => {
    //  student is on stage
    useParticipantWorkflow.setState({
      accepted: true,
    });
    //  mock the video to enable join the scene button
    const video = videoMockFactory({
      xmpp: {
        bosh_url: null,
        conference_url: 'conference',
        jid: 'jid',
        prebind_url: 'prebind',
        websocket_url: null,
      },
      live_type: LiveModeType.JITSI,
      live_state: liveState.RUNNING,
    });

    render(
      wrapInRouter(wrapInIntlProvider(<LiveControlButtons video={video} />)),
    );

    screen.getByRole('button', { name: 'Upload file' });
    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Show/Hide Chat' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Leave discussion' });
  });

  it('does not render join discussion button when ont in a live', () => {
    const video = videoMockFactory();

    render(
      wrapInRouter(wrapInIntlProvider(<LiveControlButtons video={video} />)),
    );

    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Leave discussion',
      }),
    ).not.toBeInTheDocument();
  });
});
