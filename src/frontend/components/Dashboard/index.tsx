import React from 'react';
import styled from 'styled-components';

import { Document } from '../../types/file';
import { Video } from '../../types/tracks';
import { LTINav } from '../LTINav';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100vw;
  min-height: 56.25vw; /* Default to LayoutMainArea aspect ratio, ie. 16/9. */
`;

/** Props shape for the Dashboard component. */
interface DashboardProps {
  object: Document | Video;
  children?: React.ReactNode;
}

/** Component. Displays a Dashboard with the state of the video in marsha's pipeline and provides links to
 * the player and to the form to replace the video with another one.
 * Will also be used to manage related tracks such as timed text when they are available.
 * @param video The video object from AppData. We need it to populate the component before polling starts.
 */
const Dashboard = ({ object, children }: DashboardProps) => {
  return (
    <DashboardContainer>
      <LTINav object={object} />
      {children}
    </DashboardContainer>
  );
};

export default Dashboard;
