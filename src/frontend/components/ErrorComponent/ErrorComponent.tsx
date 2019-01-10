import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { H2 } from '../Headings/Headings';
import { LayoutMainArea } from '../LayoutMainArea/LayoutMainArea';

export interface ErrorComponentProps {
  code: 'lti' | 'notFound' | 'policy' | 'upload';
}

const ErrorComponentStyled = styled(LayoutMainArea)`
  display: flex;
  flex-direction: column;
  padding: 0 2rem;
`;

const ErrorContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  flex-grow: 1;
  padding-top: 4rem;
  padding-bottom: 6rem;
  text-align: center;
`;

const messages = {
  lti: defineMessages({
    text: {
      defaultMessage: `We could not validate your access to this video. Please contact your instructor.
      If you are the instructor, please check your settings.`,
      description: 'Helpful text for the LTI error page',
      id: 'components.ErrorComponent.lti.text',
    },
    title: {
      defaultMessage: 'There was an error loading this video',
      description: 'Title for the LTI error page',
      id: 'components.ErrorComponent.lti.title',
    },
  }),
  notFound: defineMessages({
    text: {
      defaultMessage: `This video does not exist or has not been published yet.
      If you are an instructor, please make sure you are properly authenticated.`,
      description: 'Helpful text for the 404 Not Found error page',
      id: 'components.ErrorComponent.notFound.text',
    },
    title: {
      defaultMessage: 'The video you are looking for could not be found',
      description: 'Title for the 404 Not Found error page',
      id: 'components.ErrorComponent.notFound.title',
    },
  }),
  policy: defineMessages({
    text: {
      defaultMessage:
        'We could not make sure you are allowed to upload a video file. Please check your settings and/or try again.',
      description: 'Title for the upload permission error page',
      id: 'components.ErrorComponent.policy.text',
    },
    title: {
      defaultMessage: 'Failed to authenticate your permission to upload',
      description: 'Helpful text for the upload permission error page',
      id: 'components.ErrorComponent.policy.title',
    },
  }),
  upload: defineMessages({
    text: {
      defaultMessage:
        'You can try again later. You may want to check your Internet connection quality.',
      description: 'Helpful text for the Upload error page',
      id: 'components.ErrorComponent.upload.text',
    },
    title: {
      defaultMessage: 'Failed to upload your video file',
      description: 'Title for the video upload error page',
      id: 'components.ErrorComponent.upload.title',
    },
  }),
};

export const ErrorComponent = (props: ErrorComponentProps) => {
  return (
    <ErrorComponentStyled>
      <ErrorContent>
        <H2>
          <FormattedMessage {...messages[props.code].title} />
        </H2>
        <p>
          <FormattedMessage {...messages[props.code].text} />
        </p>
      </ErrorContent>
    </ErrorComponentStyled>
  );
};
