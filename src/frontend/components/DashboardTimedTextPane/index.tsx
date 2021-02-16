import React, { useState } from 'react';
import { defineMessages } from 'react-intl';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { getResourceList } from '../../data/sideEffects/getResourceList';
import { useTimedTextTrack } from '../../data/stores/useTimedTextTrack';
import { RequestStatus } from '../../types/api';
import { ModelName } from '../../types/models';
import { TimedTextMode } from '../../types/tracks';
import { useAsyncEffect } from '../../utils/useAsyncEffect';
import { DashboardTimedTextManager } from '../DashboardTimedTextManager';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';

const messages = defineMessages({
  [TimedTextMode.CLOSED_CAPTIONING]: {
    defaultMessage: 'Closed captions',
    description: 'Title for the closed captions management in the dashboard.',
    id: 'components.DashboardTimedTextPane.closedCaptions',
  },
  [TimedTextMode.SUBTITLE]: {
    defaultMessage: 'Subtitles',
    description: 'Title for the subtitles management in the dashboard.',
    id: 'components.DashboardTimedTextPane.subtitles',
  },
  [TimedTextMode.TRANSCRIPT]: {
    defaultMessage: 'Transcripts',
    description: 'Title for the transcripts management in the dashboard.',
    id: 'components.DashboardTimedTextPane.transcripts',
  },
});

const DashboardTimedTextPaneStyled = styled.div`
  padding: 1rem;
`;

/**
 * Component. Displays the complete timedtexttrack management area in the dashboard, that lets the user
 * create, delete and modify timedtexttracks related to their video.
 */
export const DashboardTimedTextPane = () => {
  const [status, setStatus] = useState('');
  useAsyncEffect(async () => {
    setStatus(await getResourceList(ModelName.TIMEDTEXTTRACKS));
  }, []);
  const timedtexttracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );

  if (status === RequestStatus.FAILURE) {
    return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
  }

  return (
    <DashboardTimedTextPaneStyled>
      {(Object.values(TimedTextMode) as TimedTextMode[]).map((mode) => (
        <DashboardTimedTextManager
          key={mode}
          message={messages[mode]}
          mode={mode}
          tracks={timedtexttracks.filter(
            (track) => track && track.mode === mode,
          )}
        />
      ))}
    </DashboardTimedTextPaneStyled>
  );
};
