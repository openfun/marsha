import { Button } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { Video } from '../../types/tracks';
import { theme } from '../../utils/theme/theme';
import { Nullable } from '../../utils/types';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { withLink } from '../withLink/withLink';

const messages = defineMessages({
  btnDashboard: {
    defaultMessage: 'Go to Dashboard',
    description: `Text for the button in the instructor view that allows the instructor to go to the dashboard.`,
    id: 'components.InstructorView.btnDashboard',
  },
  disabledDashboard: {
    defaultMessage:
      'This video is imported from another playlist. You can go to the original playlist to directly modify this video, or delete it from the current playlist and replace it by a new video.',
    description:
      'Text explaining that the ivdeo is in read_only mode and the dashboard is not available',
    id: 'components.InstructorView.disabledDashboard',
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
  videoId: Nullable<Video['id']>;
  readOnly: boolean;
}

export const InstructorView = ({
  children,
  videoId,
  readOnly,
}: InstructorViewProps) => {
  const message = readOnly ? messages.disabledDashboard : messages.title;
  return videoId ? (
    <React.Fragment>
      <PreviewWrapper>
        <Preview>{children}</Preview>
      </PreviewWrapper>
      <InstructorControls>
        <FormattedMessage {...message} />
        {!readOnly && (
          <BtnWithLink
            color={'brand'}
            label={<FormattedMessage {...messages.btnDashboard} />}
            to={DASHBOARD_ROUTE()}
          />
        )}
      </InstructorControls>
    </React.Fragment>
  ) : (
    <Redirect push to={ERROR_COMPONENT_ROUTE('lti')} />
  );
};
