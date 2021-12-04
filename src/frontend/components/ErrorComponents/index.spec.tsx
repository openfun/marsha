import { render } from '@testing-library/react';
import React from 'react';
import { useParams } from 'react-router-dom';

import { FullScreenError } from '.';
import { wrapInIntlProvider } from '../../utils/tests/intl';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn()
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>


describe('<FullScreenError />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  })
  it('displays the content for 404 not found errors', () => {
    mockUseParams.mockReturnValue({ code: 'notFound'});
    const { getByText } = render(
      wrapInIntlProvider(<FullScreenError />),
    );
    getByText('The video you are looking for could not be found');
    getByText(
      'This video does not exist or has not been published yet. If you are an instructor, please make sure you are properly authenticated.',
    );
  });

  it('displays the content for lti related errors', () => {
    mockUseParams.mockReturnValue({ code: 'lti'});
    const { getByText } = render(
      wrapInIntlProvider(<FullScreenError />),
    );
    getByText('There was an error loading this video');
    getByText(
      'We could not validate your access to this video. Please contact your instructor. If you are the instructor, please check your settings.',
    );
  });
});
