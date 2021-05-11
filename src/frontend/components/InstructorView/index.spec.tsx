import { render } from '@testing-library/react';
import React from 'react';

import {
  playlistMockFactory,
  videoMockFactory,
} from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { InstructorView } from './';

jest.mock('jwt-decode', () => jest.fn());

let mockDecodedJwt: any;
jest.mock('../../data/appData', () => ({
  appData: {
    modelName: 'videos',
  },
  getDecodedJwt: () => mockDecodedJwt,
}));

describe('<InstructorView />', () => {
  const video = videoMockFactory();

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
      `This video is read-only because it belongs to another course: ${video.playlist.lti_id}`,
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
