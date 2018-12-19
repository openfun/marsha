import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { colors } from '../../utils/theme/theme';
import { Button } from '../Button/Button';
import { ROUTE as FORM_ROUTE } from '../UploadForm/UploadForm';
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

export const InstructorView = (props: { children: React.ReactNode }) => (
  <React.Fragment>
    <PreviewWrapper>
      <Preview>{props.children}</Preview>
    </PreviewWrapper>
    <InstructorControls>
      <FormattedMessage {...messages.title} />
      <BtnWithLink to={FORM_ROUTE()} variant="primary">
        <FormattedMessage {...messages.btnUpdateVideo} />
      </BtnWithLink>
    </InstructorControls>
  </React.Fragment>
);
