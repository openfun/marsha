import * as React from 'react';

import { defineMessages, FormattedMessage } from 'react-intl';

export interface ErrorComponentProps {
  code: 'lti' | 'not_found';
}

const messages = defineMessages({
  ltiText: {
    defaultMessage: `We could not validate your access to this video. Please contact your instructor.
      If you are the instructor, please check your settings.`,
    description: '',
    id: 'components.ErrorComponent.ltiText',
  },
  ltiTitle: {
    defaultMessage: 'There was an error loading this video',
    description: 'Title for the LTI error page',
    id: 'components.ErrorComponent.ltiTitle',
  },
  notFoundText: {
    defaultMessage: `This video does not exist or has not been published yet.
      If you are an instructor, please make sure you are properly authenticated.`,
    description: 'Helpful text for the 404 Not Found error page',
    id: 'components.ErrorComponent.notFoundText',
  },
  notFoundTitle: {
    defaultMessage: 'The video you are looking for could not be found',
    description: 'Title for the 404 Not Found error page',
    id: 'components.ErrorComponent.notFoundTitle',
  },
});

export const ErrorComponent = (props: ErrorComponentProps) => {
  switch (props.code) {
    case 'not_found':
      return (
        <div className="error-component">
          <h2>
            <FormattedMessage {...messages.notFoundTitle} />
          </h2>
          <p>
            <FormattedMessage {...messages.notFoundText} />
          </p>
        </div>
      );

    case 'lti':
      return (
        <div className="error-component">
          <h2>
            <FormattedMessage {...messages.ltiTitle} />
          </h2>
          <p>
            <FormattedMessage {...messages.ltiText} />
          </p>
        </div>
      );
  }
};
