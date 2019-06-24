import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { TimedText, timedTextMode } from '../../types/tracks';
import { DashboardInternalHeading } from '../Dashboard/DashboardInternalHeading';
import { TimedTextCreationForm } from '../TimedTextCreationForm';
import { TimedTextListItem } from '../TimedTextListItem';

const DashboardTimedTextManagerStyled = styled.div`
  margin: 0 0 1.5rem;
`;

/** Props shape for the DashboardTimedTextManager component. */
interface DashboardTimedTextManagerProps {
  message: FormattedMessage.MessageDescriptor;
  mode: timedTextMode;
  tracks: TimedText[];
}

/**
 * Component. Displays a list of timedtexttracks for a certain mode and lets the user delete them,
 * replace the associated file and create new ones.
 * @param message A `MessageDescriptor` to use as the heading content for the component.
 * @param mode The mode of the timedtexttracks we're managing.
 * @param tracks The list of timedtexttracks to display.
 */
export const DashboardTimedTextManager = ({
  message,
  mode,
  tracks,
}: DashboardTimedTextManagerProps) => (
  <DashboardTimedTextManagerStyled>
    <DashboardInternalHeading>
      <FormattedMessage {...message} />
    </DashboardInternalHeading>
    {tracks.map(track => {
      return <TimedTextListItem key={track.id} track={track} />;
    })}
    <TimedTextCreationForm
      mode={mode}
      excludedLanguages={tracks.map(track => track.language)}
    />
  </DashboardTimedTextManagerStyled>
);
