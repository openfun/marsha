import * as React from 'react';
import { defineMessages } from 'react-intl';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { ConsumableQuery, requestStatus } from '../../types/api';
import { TimedText, timedTextMode } from '../../types/tracks';
import { DashboardTimedTextManager } from '../DashboardTimedTextManager/DashboardTimedTextManager';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';

const messages = defineMessages({
  [timedTextMode.CLOSED_CAPTIONING]: {
    defaultMessage: 'Closed captions',
    description: 'Title for the closed captions management in the dashboard.',
    id: 'components.DashboardTimedTextPane.closedCaptions',
  },
  [timedTextMode.SUBTITLE]: {
    defaultMessage: 'Subtitles',
    description: 'Title for the subtitles management in the dashboard.',
    id: 'components.DashboardTimedTextPane.subtitles',
  },
  [timedTextMode.TRANSCRIPT]: {
    defaultMessage: 'Transcripts',
    description: 'Title for the transcripts management in the dashboard.',
    id: 'components.DashboardTimedTextPane.transcripts',
  },
});

const DashboardTimedTextPaneStyled = styled.div`
  padding: 1rem;
`;

/** Props shape for the DashboardTimedTextPane component. */
export interface DashboardTimedTextPaneProps {
  getTimedTextTrackList: () => void;
  timedtexttracks: ConsumableQuery<TimedText>;
}

/**
 * Component. Displays the complete timedtexttrack management area in the dashboard, that lets the user
 * create, delete and modify timedtexttracks related to their video.
 * @param getTimedTextTrackList An action creator that requests the list of timed text tracks.
 * @param timedtexttracks The list of timed text tracks and status of the request.
 */
export class DashboardTimedTextPane extends React.Component<
  DashboardTimedTextPaneProps
> {
  componentDidMount() {
    this.props.getTimedTextTrackList();
  }

  render() {
    const { objects: timedtexttracks, status } = this.props.timedtexttracks;

    if (status === requestStatus.FAILURE) {
      return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
    }

    return (
      <DashboardTimedTextPaneStyled>
        {(Object.values(timedTextMode) as timedTextMode[]).map(mode => (
          <DashboardTimedTextManager
            key={mode}
            message={messages[mode]}
            mode={mode}
            tracks={timedtexttracks.filter(track => track.mode === mode)}
          />
        ))}
      </DashboardTimedTextPaneStyled>
    );
  }
}
