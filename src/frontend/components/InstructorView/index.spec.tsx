import { render } from '@testing-library/react';
import React from 'react';

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
  it('renders the instructor controls', () => {
    mockDecodedJwt = {
      maintenance: false,
      permissions: {
        can_access_dashboard: true,
      },
    };

    const { getByText } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <InstructorView>
            <div className="some-child" />
          </InstructorView>,
        ),
      ),
    );

    getByText('Instructor Preview 👆');
    getByText('Go to Dashboard');
  });

  it('removes the button when permissions.can_access_dashboard is set to false', () => {
    mockDecodedJwt = {
      context_id: 'foo+context_id',
      maintenance: false,
      permissions: {
        can_access_dashboard: false,
      },
    };

    const { getByText, queryByText } = render(
      wrapInIntlProvider(
        <InstructorView>
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
      context_id: 'foo+context_id',
      maintenance: true,
      permissions: {
        can_access_dashboard: true,
      },
    };

    const { getByText, queryByText } = render(
      wrapInIntlProvider(
        <InstructorView>
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
