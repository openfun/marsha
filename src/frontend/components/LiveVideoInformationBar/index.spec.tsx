import { render, screen } from '@testing-library/react';
import React from 'react';

import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { LiveVideoInformationBar } from '.';

jest.mock('data/appData', () => ({
  appData: {},
}));
jest.mock('./LiveTitleInformation', () => ({
  LiveTitleInformation: (props: { title: string; state: liveState }) => (
    <div title={'live title information'}>
      <p>{props.title}</p>
      <p>{props.state}</p>
    </div>
  ),
}));
jest.mock('./LiveControlButtons', () => ({
  LiveControlButtons: () => <div title={'live control buttons'} />,
}));

describe('<LiveVideoInformationBar />', () => {
  it('all components and propagate video data', () => {
    const video = videoMockFactory({
      title: 'video title',
      live_state: liveState.RUNNING,
    });

    render(wrapInIntlProvider(<LiveVideoInformationBar video={video} />));

    screen.getByTitle('live title information');
    screen.getByTitle('live control buttons');
    screen.getByText(video.title);
    screen.getByText(video.live_state || '');
  });
});
