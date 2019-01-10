import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { modelName } from '../../types/models';
import { Video } from '../../types/tracks';
import { colors } from '../../utils/theme/theme';
import { Nullable } from '../../utils/types';
import { Button } from '../Button/Button';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { withLink } from '../withLink/withLink';

const messages = defineMessages({
  btnUpdateVideo: {
    defaultMessage: 'Replace the video',
    description: `Text for the button in the instructor view that allows the instructor to upload another
      video to replace the one currently being shown.`,
    id: 'components.InstructorView.btnUpdateVideo',
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
        <BtnWithLink
          to={UPLOAD_FORM_ROUTE(modelName.VIDEOS, videoId)}
          variant="primary"
        >
          <FormattedMessage {...messages.btnUpdateVideo} />
        </BtnWithLink>
      </InstructorControls>
    </React.Fragment>
  ) : (
    <Redirect push to={ERROR_COMPONENT_ROUTE('lti')} />
  );
