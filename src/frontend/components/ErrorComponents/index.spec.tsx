import { render } from '@testing-library/react';
import React from 'react';

import { FullScreenError } from '.';
import { wrapInIntlProvider } from '../../utils/tests/intl';

describe('<FullScreenError />', () => {
  it('displays the content for 404 not found errors', () => {
    const { getByText } = render(
      wrapInIntlProvider(<FullScreenError code="notFound" />),
    );
    getByText('The video you are looking for could not be found');
    getByText(
      'This video does not exist or has not been published yet. If you are an instructor, please make sure you are properly authenticated.',
    );
  });

  it('displays the content for lti related errors', () => {
    const { getByText } = render(
      wrapInIntlProvider(<FullScreenError code="lti" />),
    );
    getByText('There was an error loading this video');
    getByText(
      'We could not validate your access to this video. Please contact your instructor. If you are the instructor, please check your settings.',
    );
  });
});
