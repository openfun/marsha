import * as React from 'react';
import { defineMessages } from 'react-intl';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { getTimedTextTrackList } from '../../data/sideEffects/getTimedTextTrackList/getTimedTextTrackList';
import { TimedText, timedTextMode } from '../../types/tracks';
import { Nullable } from '../../utils/types';
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
  addAllTimedTextTracks: (timedtexttracks: TimedText[]) => void;
  jwt: Nullable<string>;
}

/** State shape for the DashboardTimedTextPane component. */
interface DashboardTimedTextPaneState {
  error?: 'notFound';
  timedtexttracks: TimedText[];
}

/**
 * Component. Displays the complete timedtexttrack management area in the dashboard, that lets the user
 * create, delete and modify timedtexttracks related to their video.
 * @param addAllTimedTextTracks An action creator that will add the passed timedtexttracks to the store.
 * @param jwt The token that will be used to interact with the API.
 */
export class DashboardTimedTextPane extends React.Component<
  DashboardTimedTextPaneProps,
  DashboardTimedTextPaneState
> {
  constructor(props: DashboardTimedTextPaneProps) {
    super(props);
    this.state = { timedtexttracks: [] };
  }

  async componentDidMount() {
    const { addAllTimedTextTracks, jwt } = this.props;
    try {
      const timedtexttracks = await getTimedTextTrackList(jwt);
      addAllTimedTextTracks(timedtexttracks);
      this.setState({ timedtexttracks });
    } catch (error) {
      this.setState({ error: 'notFound' });
    }
  }

  render() {
    const { error, timedtexttracks } = this.state;

    if (error === 'notFound') {
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
