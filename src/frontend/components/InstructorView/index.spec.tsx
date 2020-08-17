import { render } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { InstructorView } from './';
import { Video } from '../../types/tracks';

jest.mock('jwt-decode', () => jest.fn());

let mockDecodedJwt: any;
jest.mock('../../data/appData', () => ({
  appData: {
    modelName: 'videos',
  },
  getDecodedJwt: () => mockDecodedJwt,
}));

describe('<InstructorView />', () => {
  const video = {
    id: 'bc5b2a9a-4963-4a55-bb79-b94489a8164f',
    playlist: {
      title: 'foo',
      lti_id: 'foo+context_id',
    },
  } as Video;
  it('renders the instructor controls', () => {
    mockDecodedJwt = {
      maintenance: false,
      permissions: {
        can_update: true,
      },
    };

    const { getByText } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <InstructorView resource={video}>
            <div className="some-child" />
          </InstructorView>,
        ),
      ),
    );

    getByText('Instructor Preview 👆');
    getByText('Go to Dashboard');
  });

  it('removes the button when permissions.can_update is set to false', () => {
    mockDecodedJwt = {
      maintenance: false,
      permissions: {
        can_update: false,
      },
    };

    const { getByText, queryByText } = render(
      wrapInIntlProvider(
        <InstructorView resource={video}>
          <div className="some-child" />
        </InstructorView>,
      ),
    );

    getByText(
      'This video is read-only because it belongs to another course: foo+context_id',
    );
    expect(queryByText('Go to Dashboard')).toBeNull();
  });

  it('removes the button when permissions.maintenance is set to true', () => {
    mockDecodedJwt = {
      maintenance: true,
      permissions: {
        can_update: true,
      },
    };

    const { getByText, queryByText } = render(
      wrapInIntlProvider(
        <InstructorView resource={video}>
          <div className="some-child" />
        </InstructorView>,
      ),
    );

    getByText(
      "The dashboard is undergoing maintenance work, it can't be accessed right now.",
    );
    expect(queryByText('Go to Dashboard')).toBeNull();
  });
});
