import { Button } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { appData, getDecodedJwt } from '../../data/appData';
import { theme } from '../../utils/theme/theme';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { withLink } from '../withLink/withLink';
import { Document } from '../../types/file';
import { Video } from '../../types/tracks';

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
      'Text explaining that the ivdeo is in read_only mode and the dashboard is not available',
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

const BtnWithLink = withLink(Button);

interface InstructorViewProps {
  children: React.ReactNode;
  resource: Video | Document;
}

export const InstructorView = ({ children, resource }: InstructorViewProps) => {
  const canAccessDashboard =
    getDecodedJwt().permissions.can_update &&
    getDecodedJwt().maintenance === false;
  let message;
  if (canAccessDashboard) {
    message = messages.title;
  } else if (getDecodedJwt().maintenance) {
    message = messages.maintenance;
  } else {
    message = messages.disabledDashboard;
  }

  const messagePlaceholder = canAccessDashboard
    ? {}
    : { lti_id: resource.playlist.lti_id };
  return (
    <React.Fragment>
      <PreviewWrapper>
        <Preview>{children}</Preview>
      </PreviewWrapper>
      <InstructorControls>
        <FormattedMessage {...message} values={messagePlaceholder} />
        {canAccessDashboard && (
          <BtnWithLink
            color="brand"
            label={<FormattedMessage {...messages.btnDashboard} />}
            to={DASHBOARD_ROUTE(appData.modelName)}
          />
        )}
      </InstructorControls>
    </React.Fragment>
  );
};
