import React, { useEffect } from 'react';
import { defineMessages } from 'react-intl';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Dispatch } from 'redux';
import styled from 'styled-components';

import { RootState } from '../../data/rootReducer';
import { getResourceList } from '../../data/sideEffects/getResourceList';
import { getTimedTextTracks } from '../../data/timedtexttracks/selector';
import { ConsumableQuery, requestStatus } from '../../types/api';
import { modelName } from '../../types/models';
import { TimedText, timedTextMode } from '../../types/tracks';
import { DashboardTimedTextManager } from '../DashboardTimedTextManager';
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
interface BaseDashboardTimedTextPaneProps {
  doGetResourceList: ReturnType<typeof getResourceList>;
  timedtexttracks: ConsumableQuery<TimedText>;
}

/**
 * Component. Displays the complete timedtexttrack management area in the dashboard, that lets the user
 * create, delete and modify timedtexttracks related to their video.
 */
const BaseDashboardTimedTextPane = ({
  doGetResourceList,
  timedtexttracks: { objects: timedtexttracks, status },
}: BaseDashboardTimedTextPaneProps) => {
  useEffect(() => {
    doGetResourceList(modelName.TIMEDTEXTTRACKS);
  }, []);

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
};

/**
 * Build props for `<DashboardTimedTextPaneConnected />` from `RootState`.
 * Intended for internal use, exported for testing purposes only.
 */
const mapStateToProps = (state: RootState) => ({
  timedtexttracks: getTimedTextTracks(state),
});

/** Create a function that adds a bunch of timedtexttracks in the store. */
const mergeProps = (
  { timedtexttracks }: { timedtexttracks: ConsumableQuery<TimedText> },
  { dispatch }: { dispatch: Dispatch },
) => ({
  doGetResourceList: getResourceList(dispatch),
  timedtexttracks,
});

/**
 * Component. Displays the complete timedtexttrack management area in the dashboard, that lets the user
 * create, delete and modify timedtexttracks related to their video.
 */
export const DashboardTimedTextPane = connect(
  mapStateToProps,
  null!,
  mergeProps,
)(BaseDashboardTimedTextPane);
