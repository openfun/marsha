/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render } from 'lib-tests';
import React from 'react';

import { FullScreenError } from '.';

describe('<FullScreenError />', () => {
  it('displays the content for 404 not found errors', () => {
    const { getByText } = render(<FullScreenError code="notFound" />);
    getByText('The video you are looking for could not be found');
    getByText(
      'This video does not exist or has not been published yet. If you are an instructor, please make sure you are properly authenticated.',
    );
  });

  it('displays the content for lti related errors', () => {
    const { getByText } = render(<FullScreenError code="lti" />);
    getByText('There was an error loading this video');
    getByText(
      'We could not validate your access to this video. Please contact your instructor. If you are the instructor, please check your settings.',
    );
  });
});
