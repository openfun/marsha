import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Video } from '../../types/tracks';
import { DashboardTimedTextPaneConnected } from '../DashboardTimedTextPaneConnected/DashboardTimedTextPaneConnected';
import { DashboardVideoPaneConnected } from '../DashboardVideoPaneConnected/DashboardVideoPaneConnected';
import { IframeHeading } from '../Headings/Headings';

const messages = defineMessages({
  title: {
    defaultMessage: 'Dashboard',
    description: `Title for the dashboard, where the user can see the status of the video/audio/timed text upload
      & processing, and will be able to manage them.`,
    id: 'components.Dashboard.title',
  },
});

const IframeHeadingWithLayout = styled(IframeHeading)`
  flex-grow: 0;
  margin: 0;
  text-align: center;
`;

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100vw;
  min-height: 56.25vw; /* Default to LayoutMainArea aspect ratio, ie. 16/9. */
`;

/** Props shape for the Dashboard component. */
export interface DashboardProps {
  video: Video;
}

/** Component. Displays a Dashboard with the state of the video in marsha's pipeline and provides links to
 * the player and to the form to replace the video with another one.
 * Will also be used to manage related tracks such as timed text when they are available.
 * @param video The video object from AppData. We need it to populate the component before polling starts.
 */
export class Dashboard extends React.Component<DashboardProps> {
  render() {
    return (
      <DashboardContainer>
        <IframeHeadingWithLayout>
          <FormattedMessage {...messages.title} />
        </IframeHeadingWithLayout>
        <DashboardVideoPaneConnected video={this.props.video} />
        <DashboardTimedTextPaneConnected video={this.props.video} />
      </DashboardContainer>
    );
  }
}
