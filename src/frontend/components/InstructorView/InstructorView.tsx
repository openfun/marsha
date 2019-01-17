import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { Video } from '../../types/tracks';
import { colors } from '../../utils/theme/theme';
import { Nullable } from '../../utils/types';
import { Button } from '../Button/Button';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { withLink } from '../withLink/withLink';

const messages = defineMessages({
  btnDashboard: {
    defaultMessage: 'Go to Dashboard',
    description: `Text for the button in the instructor view that allows the instructor to go to the dashboard.`,
    id: 'components.InstructorView.btnDashboard',
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
  background: ${colors.mediumGray.main};
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
  videoId: Nullable<Video['id']>;
}

export const InstructorView = ({ children, videoId }: InstructorViewProps) =>
  videoId ? (
    <React.Fragment>
      <PreviewWrapper>
        <Preview>{children}</Preview>
      </PreviewWrapper>
      <InstructorControls>
        <FormattedMessage {...messages.title} />
        <BtnWithLink to={DASHBOARD_ROUTE()} variant="primary">
          <FormattedMessage {...messages.btnDashboard} />
        </BtnWithLink>
      </InstructorControls>
    </React.Fragment>
  ) : (
    <Redirect push to={ERROR_COMPONENT_ROUTE('lti')} />
  );
