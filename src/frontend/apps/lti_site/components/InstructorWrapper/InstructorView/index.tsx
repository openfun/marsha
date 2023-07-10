import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import {
  Document,
  Video,
  useCurrentResourceContext,
  useMaintenance,
} from 'lib-components';
import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';
import styled from 'styled-components';

import { LTINav } from 'components/LTINav';

const messages = defineMessages({
  btnDashboard: {
    defaultMessage: 'Go to Dashboard',
    description: `Text for the button in the instructor view that allows the instructor to go to the dashboard.`,
    id: 'components.InstructorView.btnDashboard',
  },
  disabledDashboard: {
    defaultMessage:
      'This video is read-only because it belongs to another course: {lti_id}',
    description:
      'Text explaining that the video is in read_only mode and the dashboard is not available',
    id: 'components.InstructorView.disabledDashboard',
  },
  maintenance: {
    defaultMessage:
      "The dashboard is undergoing maintenance work, it can't be accessed right now.",
    description:
      'Text explaining that the dashboard is not accessible because marsha is in maintenance',
    id: 'components.InstructorView.maintenance',
  },
  title: {
    defaultMessage: 'Instructor Preview 👆',
    description: `Title for the Instructor View. Describes the area appearing right above, which is a preview
      of what the student will see there.`,
    id: 'components.InstructorView.title',
  },
});

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100vw;
  min-height: 56.25vw; /* Default to LayoutMainArea aspect ratio, ie. 16/9. */
`;

export const Preview = styled.div`
  transform: scale(0.85);
`;

const PreviewWrapper = styled.div`
  background: ${normalizeColor('light-5', theme)};
`;

export const InstructorControls = styled.div`
  display: flex;
  height: 4rem;
  padding: 1rem;
  align-items: center;
  justify-content: space-between;
`;

interface InstructorViewProps {
  children: React.ReactNode;
  resource: Video | Document;
}

export const InstructorView = ({ children, resource }: InstructorViewProps) => {
  const [context] = useCurrentResourceContext();
  const isMaintenanceOn = useMaintenance((state) => state.isActive);

  const canAccessDashboard = context.permissions.can_update && !isMaintenanceOn;
  const message = canAccessDashboard
    ? messages.title
    : isMaintenanceOn
    ? messages.maintenance
    : messages.disabledDashboard;
  const messagePlaceholder = canAccessDashboard
    ? {}
    : { lti_id: resource.playlist.lti_id };

  return (
    <DashboardContainer>
      <LTINav object={resource} />
      <PreviewWrapper>
        <Preview>{children}</Preview>
      </PreviewWrapper>
      <InstructorControls>
        <FormattedMessage {...message} values={messagePlaceholder} />
      </InstructorControls>
    </DashboardContainer>
  );
};
