import React, { useState } from 'react';
import { defineMessages } from 'react-intl';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { getResourceList } from '../../data/sideEffects/getResourceList';
import { useTimedTextTrack } from '../../data/stores/useTimedTextTrack';
import { requestStatus } from '../../types/api';
import { modelName } from '../../types/models';
import { timedTextMode } from '../../types/tracks';
import { useAsyncEffect } from '../../utils/useAsyncEffect';
import { DashboardTimedTextManager } from '../DashboardTimedTextManager';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';

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

/**
 * Component. Displays the complete timedtexttrack management area in the dashboard, that lets the user
 * create, delete and modify timedtexttracks related to their video.
 */
export const DashboardTimedTextPane = () => {
  const [status, setStatus] = useState('');
  useAsyncEffect(async () => {
    setStatus(await getResourceList(modelName.TIMEDTEXTTRACKS));
  }, []);
  const timedtexttracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );

  if (status === requestStatus.FAILURE) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
  }

  return (
    <DashboardTimedTextPaneStyled>
      {(Object.values(timedTextMode) as timedTextMode[]).map((mode) => (
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
